import express, { Request, Response } from 'express';
import { db } from '../db/database.ts';
import { geminiAgent } from '../ai/gemini.ts';
import { whatsAppService } from '../whatsapp/whatsappService.ts';
import { messengerService } from '../facebook/messengerService.ts';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// --- STATS ---
router.get('/dashboard/stats', (req: Request, res: Response) => {
  const stats = db.getStats();
  res.json({ success: true, data: stats });
});

// --- PRODUCTS ---
router.get('/products', (req: Request, res: Response) => {
  const { status, search } = req.query;
  const products = db.getProducts({
    status: status as string,
    search: search as string,
  });
  res.json({ success: true, data: products });
});

router.get('/products/:id', (req: Request, res: Response) => {
  const product = db.getProductById(req.params.id);
  if (!product) {
    return res.status(404).json({ success: false, error: 'Product not found' });
  }
  res.json({ success: true, data: product });
});

router.post('/products', async (req: Request, res: Response) => {
  try {
    const product = db.addProduct(req.body, 'Admin Web UI');
    // Automatically broadcast to WhatsApp Product Management Group (Group 1)
    await whatsAppService.broadcastNewProduct(product, 'Admin Web UI');
    res.status(201).json({ success: true, data: product });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Image Upload Endpoint (handles direct image file upload and immediately uploads to WhatsApp Group 1)
router.post('/upload', async (req: Request, res: Response) => {
  try {
    const { dataUrl, filename, productId, productName, broadcastToWhatsApp = true } = req.body;
    if (!dataUrl) {
      return res.status(400).json({ success: false, error: 'Image dataUrl is required' });
    }

    const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ success: false, error: 'Invalid base64 data URI' });
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    let ext = 'jpg';
    if (mimeType.includes('png')) ext = 'png';
    else if (mimeType.includes('webp')) ext = 'webp';
    else if (mimeType.includes('jpeg')) ext = 'jpg';
    else if (mimeType.includes('gif')) ext = 'gif';

    const safeName = `batik_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
    const uploadsDir = path.resolve(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filePath = path.join(uploadsDir, safeName);
    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/${safeName}`;
    db.log('Product', 'info', `New product image uploaded successfully: ${publicUrl}`);

    // Immediately post/upload the image to WhatsApp Group 1 (Product Management Group)
    let waMessage;
    if (broadcastToWhatsApp) {
      waMessage = await whatsAppService.broadcastImageUpload({
        imageUrl: publicUrl,
        productId,
        productName,
        uploadedBy: 'Admin Web UI',
      });
    }

    res.json({
      success: true,
      url: publicUrl,
      filename: safeName,
      whatsappSynced: Boolean(waMessage),
      waMessageId: waMessage?.id,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/products/:id', (req: Request, res: Response) => {
  const updated = db.updateProduct(req.params.id, req.body, 'Admin Web UI');
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Product not found' });
  }
  res.json({ success: true, data: updated });
});

router.delete('/products/:id', (req: Request, res: Response) => {
  const ok = db.deleteProduct(req.params.id, 'Admin Web UI');
  if (!ok) {
    return res.status(404).json({ success: false, error: 'Product not found' });
  }
  res.json({ success: true, message: 'Product deleted' });
});

router.patch('/products/:id/stock', (req: Request, res: Response) => {
  const { stock } = req.body;
  if (stock === undefined) {
    return res.status(400).json({ success: false, error: 'Stock number required' });
  }
  const updated = db.updateStock(req.params.id, Number(stock), 'Admin Web UI');
  if (!updated) return res.status(404).json({ success: false, error: 'Product not found' });
  res.json({ success: true, data: updated });
});

router.patch('/products/:id/price', (req: Request, res: Response) => {
  const { price, discount_price } = req.body;
  if (price === undefined) {
    return res.status(400).json({ success: false, error: 'Price required' });
  }
  const updated = db.updatePrice(req.params.id, Number(price), discount_price !== undefined ? Number(discount_price) : undefined, 'Admin Web UI');
  if (!updated) return res.status(404).json({ success: false, error: 'Product not found' });
  res.json({ success: true, data: updated });
});

router.patch('/products/:id/toggle', (req: Request, res: Response) => {
  const prod = db.getProductById(req.params.id);
  if (!prod) return res.status(404).json({ success: false, error: 'Product not found' });
  const newStatus = prod.status === 'active' ? 'inactive' : 'active';
  const updated = db.updateProduct(prod.id, { status: newStatus }, 'Admin Web UI');
  res.json({ success: true, data: updated });
});

// --- ORDERS ---
router.get('/orders', (req: Request, res: Response) => {
  const { status, search } = req.query;
  const orders = db.getOrders({
    status: status as string,
    search: search as string,
  });
  res.json({ success: true, data: orders });
});

router.get('/orders/:id', (req: Request, res: Response) => {
  const order = db.getOrderById(req.params.id);
  if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
  const history = db.getOrderStatusHistory(order.id);
  res.json({ success: true, data: { ...order, history } });
});

router.post('/orders', (req: Request, res: Response) => {
  const result = db.createConfirmedOrder(req.body, 'Admin Manual Order');
  if (!result.success) {
    return res.status(400).json({ success: false, error: result.error });
  }
  // Send notification to WhatsApp Group 2
  whatsAppService.sendOrderNotification(result.order);
  res.status(201).json({ success: true, data: result.order });
});

router.patch('/orders/:id/status', (req: Request, res: Response) => {
  const { status, note, changed_by } = req.body;
  if (!status) return res.status(400).json({ success: false, error: 'Status is required' });
  const updated = db.updateOrderStatus(req.params.id, status, changed_by || 'Admin Dashboard', note);
  if (!updated) return res.status(404).json({ success: false, error: 'Order not found' });
  res.json({ success: true, data: updated });
});

router.post('/orders/:id/retry-notification', async (req: Request, res: Response) => {
  const order = db.getOrderById(req.params.id);
  if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
  const notifResult = await whatsAppService.sendOrderNotification(order);
  res.json({ success: true, data: notifResult });
});

// --- CUSTOMERS ---
router.get('/customers', (req: Request, res: Response) => {
  const { search } = req.query;
  const customers = db.getCustomers(search as string);
  res.json({ success: true, data: customers });
});

router.get('/customers/:id', (req: Request, res: Response) => {
  const customer = db.getCustomerById(req.params.id);
  if (!customer) return res.status(404).json({ success: false, error: 'Customer not found' });
  const customerOrders = db.getOrders().filter((o) => o.customer_id === customer.id || o.mobile_number === customer.mobile_number);
  res.json({ success: true, data: { ...customer, orders: customerOrders } });
});

// --- MESSENGER & CHAT SIMULATOR ---
router.get('/chat/conversation', (req: Request, res: Response) => {
  const { psid } = req.query;
  const conv = db.getOrCreateConversation({
    facebook_psid: (psid as string) || 'simulated-messenger-user',
    platform: 'web_simulator',
  });
  const messages = db.getMessages(conv.id);
  res.json({ success: true, data: { conversation: conv, messages } });
});

router.post('/chat/message', async (req: Request, res: Response) => {
  const { text, psid } = req.body;
  if (!text?.trim()) {
    return res.status(400).json({ success: false, error: 'Message text is required' });
  }

  const senderPsid = psid || 'simulated-messenger-user';
  const conv = db.getOrCreateConversation({
    facebook_psid: senderPsid,
    platform: 'web_simulator',
  });

  // 1. Record customer message
  const customerMsg = db.addMessage(conv.id, 'customer', text);

  // 2. Process message through AI Agent
  const aiResult = await geminiAgent.processCustomerMessage({
    conversationId: conv.id,
    messageText: text,
    platform: 'web_simulator',
    facebookPsid: senderPsid,
  });

  // 3. Record AI message
  const aiMsg = db.addMessage(conv.id, 'ai', aiResult.reply, aiResult.imageUrl, aiResult.orderSummary);

  const updatedMessages = db.getMessages(conv.id);

  res.json({
    success: true,
    data: {
      customerMessage: customerMsg,
      aiMessage: aiMsg,
      messages: updatedMessages,
      isHandoff: aiResult.isHandoff || conv.is_human_handoff,
    },
  });
});

router.post('/chat/admin-reply', (req: Request, res: Response) => {
  const { conversation_id, text } = req.body;
  if (!conversation_id || !text) {
    return res.status(400).json({ success: false, error: 'Conversation ID and text are required' });
  }

  const msg = db.addMessage(conversation_id, 'admin', text);
  db.log('AI', 'info', `Admin sent direct reply to conversation ${conversation_id}: "${text}"`);
  res.json({ success: true, data: msg });
});

// --- HUMAN HANDOFF ---
router.get('/handoff', (req: Request, res: Response) => {
  const list = db.getHandoffRequests();
  res.json({ success: true, data: list });
});

router.post('/handoff/:id/resolve', (req: Request, res: Response) => {
  const ok = db.resolveHumanHandoff(req.params.id);
  res.json({ success: ok });
});

// --- WHATSAPP COMMUNITY & GROUPS ---
router.get('/whatsapp/groups', (req: Request, res: Response) => {
  const communities = db.getWhatsAppCommunities();
  const groups = db.getWhatsAppGroups();
  const admins = db.getWhatsAppAdmins();
  res.json({
    success: true,
    data: {
      communities,
      groups,
      admins,
    },
  });
});

router.get('/whatsapp/messages', (req: Request, res: Response) => {
  const { groupId } = req.query;
  const messages = whatsAppService.getMessagesByGroup(groupId as string);
  res.json({ success: true, data: messages });
});

router.post('/whatsapp/command', (req: Request, res: Response) => {
  const { senderPhone, senderName, text } = req.body;
  if (!text) return res.status(400).json({ success: false, error: 'Command text required' });

  const result = whatsAppService.handleProductManagementCommand(
    senderPhone || '+8801819123456',
    senderName || 'Admin Operator',
    text
  );

  res.json({ success: true, data: result });
});

router.post('/whatsapp/admins', (req: Request, res: Response) => {
  try {
    const admin = db.addWhatsAppAdmin(req.body);
    res.status(201).json({ success: true, data: admin });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.delete('/whatsapp/admins/:id', (req: Request, res: Response) => {
  const ok = db.removeWhatsAppAdmin(req.params.id);
  res.json({ success: ok });
});

// --- SETTINGS ---
router.get('/settings', (req: Request, res: Response) => {
  res.json({ success: true, data: db.getSettings() });
});

router.post('/settings/:type', (req: Request, res: Response) => {
  const type = req.params.type;
  let updated;
  if (type === 'ai') updated = db.updateAISettings(req.body);
  else if (type === 'business') updated = db.updateBusinessSettings(req.body);
  else if (type === 'delivery') updated = db.updateDeliverySettings(req.body);
  else if (type === 'facebook') updated = db.updateFacebookSettings(req.body);
  else if (type === 'whatsapp') updated = db.updateWhatsAppSettings(req.body);
  else return res.status(400).json({ success: false, error: 'Invalid settings type' });

  res.json({ success: true, data: updated });
});

// --- AI CONNECTION TEST ---
router.post('/ai/test-connection', async (req: Request, res: Response) => {
  try {
    const { provider, model, apiKey } = req.body;
    const settings = db.getSettings();
    const prov = provider || settings.ai.provider;
    const mdl = model || settings.ai.model;
    const customKeys = db.getRawAIKeys();

    if (prov === 'gemini') {
      const key = apiKey || customKeys.gemini || process.env.GEMINI_API_KEY;
      if (!key || key === 'MY_GEMINI_API_KEY') {
        return res.status(400).json({ success: false, error: 'Gemini API Key পাওয়া যায়নি।' });
      }
      const { GoogleGenAI } = await import('@google/genai');
      const testAI = new GoogleGenAI({ apiKey: key });
      const resp = await testAI.models.generateContent({
        model: mdl.includes('gemini') ? mdl : 'gemini-3.8-flash',
        contents: [{ role: 'user', parts: [{ text: 'Hello, respond with: OK' }] }],
      });
      return res.json({ success: true, message: 'Google Gemini সফলভাবে কানেক্টেড!', text: resp.text });
    }

    if (prov === 'openai' || prov === 'grok' || prov === 'deepseek') {
      let key = apiKey;
      let url = '';
      if (prov === 'openai') {
        key = key || customKeys.openai || process.env.OPENAI_API_KEY;
        url = 'https://api.openai.com/v1/chat/completions';
      } else if (prov === 'grok') {
        key = key || customKeys.grok || process.env.GROK_API_KEY || process.env.XAI_API_KEY;
        url = 'https://api.x.ai/v1/chat/completions';
      } else if (prov === 'deepseek') {
        key = key || customKeys.deepseek || process.env.DEEPSEEK_API_KEY;
        url = 'https://api.deepseek.com/chat/completions';
      }

      if (!key) {
        return res.status(400).json({ success: false, error: `${prov.toUpperCase()} API Key প্রদান করা হয়নি।` });
      }

      const testRes = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: mdl,
          messages: [{ role: 'user', content: 'Hello' }],
          max_tokens: 10,
        }),
      });

      if (!testRes.ok) {
        const errText = await testRes.text();
        return res.status(testRes.status).json({ success: false, error: `${prov.toUpperCase()} error: ${errText}` });
      }

      return res.json({ success: true, message: `${prov.toUpperCase()} (${mdl}) সফলভাবে কানেক্টেড!` });
    }

    res.status(400).json({ success: false, error: 'Unknown provider' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- MYSQL SCHEMA & DATABASE DUMP ---
router.post('/database/clear-data', (req: Request, res: Response) => {
  const success = db.clearAllData('Admin requested wipe via UI');
  whatsAppService.clearFeed();
  res.json({ success, message: 'All demo products, orders, and customer data cleared.' });
});

router.get('/database/schema', (req: Request, res: Response) => {
  try {
    const schemaPath = path.resolve(process.cwd(), 'src/server/db/schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf-8');
      return res.type('text/plain').send(sql);
    }
    res.status(404).send('-- Schema file not found');
  } catch (err: any) {
    res.status(500).send(`-- Error: ${err.message}`);
  }
});

router.get('/logs', (req: Request, res: Response) => {
  res.json({ success: true, data: db.getSystemLogs() });
});

// --- FACEBOOK WEBHOOK ENDPOINTS ---
router.get('/webhook/facebook', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'] as string;
  const token = req.query['hub.verify_token'] as string;
  const challenge = req.query['hub.challenge'] as string;

  const result = messengerService.verifyWebhook(mode, token, challenge);
  res.status(result.status).send(result.body);
});

router.post('/webhook/facebook', async (req: Request, res: Response) => {
  try {
    await messengerService.handleWebhookEvent(req.body);
    res.status(200).send('EVENT_RECEIVED');
  } catch (err: any) {
    db.log('Facebook', 'error', `Webhook processing error: ${err.message}`, err);
    res.sendStatus(500);
  }
});

// --- WHATSAPP CLOUD API WEBHOOK ENDPOINTS ---
router.get('/webhook/whatsapp', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'] as string;
  const token = req.query['hub.verify_token'] as string;
  const challenge = req.query['hub.challenge'] as string;
  const settings = db.getSettings();
  const verifyToken = settings.whatsapp?.webhook_verify_token || 'ghorer_wa_verify_2026';

  if (mode === 'subscribe' && token === verifyToken) {
    db.log('WhatsApp', 'info', 'WhatsApp Webhook verified successfully');
    return res.status(200).send(challenge);
  }
  db.log('WhatsApp', 'warn', `WhatsApp Webhook verification failed. Token received: ${token}`);
  return res.sendStatus(403);
});

router.post('/webhook/whatsapp', async (req: Request, res: Response) => {
  try {
    db.log('WhatsApp', 'info', 'Received WhatsApp Cloud API webhook event');
    res.status(200).send('EVENT_RECEIVED');
  } catch (err: any) {
    db.log('WhatsApp', 'error', `WhatsApp webhook processing error: ${err.message}`, err);
    res.sendStatus(500);
  }
});

export default router;
