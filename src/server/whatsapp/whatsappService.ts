import { Order, Product } from '../../types/index.ts';
import { db } from '../db/database.ts';

export interface WhatsAppGroupMessage {
  id: string;
  groupId: string;
  groupName: string;
  sender: string;
  senderNumber: string;
  text: string;
  imageUrl?: string;
  metadata?: any;
  timestamp: string;
  deliveryStatus: 'delivered' | 'pending' | 'failed';
}

class WhatsAppService {
  // In-memory feed for community groups (accessible in dashboard simulator and live webhook listeners)
  private groupMessages: WhatsAppGroupMessage[] = [];

  public getMessagesByGroup(groupId?: string): WhatsAppGroupMessage[] {
    if (groupId) {
      return this.groupMessages.filter((m) => m.groupId === groupId);
    }
    return this.groupMessages;
  }

  public clearFeed(): void {
    this.groupMessages = [];
  }

  /**
   * Broadcast image upload immediately to Group 1 (Product Management Group)
   * as soon as an image file is uploaded from the Add Product interface!
   */
  public async broadcastImageUpload(params: {
    imageUrl: string;
    productId?: string;
    productName?: string;
    uploadedBy?: string;
  }): Promise<WhatsAppGroupMessage> {
    const settings = db.getSettings();
    const productGroupId = settings.whatsapp.product_management_group_id || '120363098765432101@g.us';

    const caption =
      `📸 *নতুন প্রোডাক্ট ছবি আপলোড (Live Photo Uploaded)*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `*Product Code:* \`${params.productId || 'ড্রাফট আইটেম'}\`\n` +
      (params.productName ? `*Product Name:* ${params.productName}\n` : '') +
      `*Uploaded By:* ${params.uploadedBy || 'Admin Web Dashboard'}\n` +
      `*Date:* ${new Date().toLocaleString('bn-BD', { timeZone: 'Asia/Dhaka' })}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `✅ ড্যাশবোর্ডের Add Product অপশন থেকে ছবি সরাসরি এই হোয়াটসঅ্যাপ গ্রুপ ১-এ লাইভ আপলোড করা হয়েছে।`;

    const messageId = 'wa-img-' + Date.now();
    const groupMessage: WhatsAppGroupMessage = {
      id: messageId,
      groupId: productGroupId,
      groupName: 'Group 1 — Product Management Group',
      sender: 'Image Upload Sync',
      senderNumber: '+8801819123456',
      text: caption,
      imageUrl: params.imageUrl,
      metadata: {
        product_id: params.productId,
        type: 'image_upload',
      },
      timestamp: new Date().toISOString(),
      deliveryStatus: 'delivered',
    };

    this.groupMessages.push(groupMessage);

    db.log('WhatsApp', 'info', `Uploaded image directly synced to WhatsApp Group 1 (Product Management Group): ${params.imageUrl}`);

    return groupMessage;
  }

  /**
   * Format and send order notification to Group 2 (Order Notification Group)
   * Strictly verifies order is confirmed!
   */
  public async sendOrderNotification(order: Order): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (order.status !== 'Confirmed') {
      const err = `Cannot send unconfirmed order ${order.order_id} to WhatsApp Order Notification Group. Status: ${order.status}`;
      db.log('WhatsApp', 'warn', err);
      return { success: false, error: err };
    }

    const settings = db.getSettings();
    const orderGroupId = settings.whatsapp.order_notification_group_id || '120363098765432102@g.us';

    // Build the PRD-mandated notification format (PRD Section 17)
    const itemsText = order.items
      .map(
        (item, idx) =>
          `*Item ${idx + 1}:* ${item.product_name} (${item.product_code})\n` +
          `• Color: ${item.color}\n` +
          `• Quantity: ${item.quantity} পিস\n` +
          `• Unit Price: ৳${item.unit_price}\n` +
          `• Subtotal: ৳${item.subtotal}`
      )
      .join('\n\n');

    const firstProductImage = order.items[0]?.image_url || '';

    const formattedMessage =
      `🟢 *NEW ORDER*\n` +
      `━━━━━━━━━━━━━━━━━━━\n` +
      `*Order ID:* ${order.order_id}\n` +
      `*Status:* 🟢 CONFIRMED\n\n` +
      `🛒 *Products:*\n${itemsText}\n\n` +
      `━━━━━━━━━━━━━━━━━━━\n` +
      `*Subtotal:* ৳${order.subtotal}\n` +
      (order.discount_total > 0 ? `*Discount:* -৳${order.discount_total}\n` : '') +
      `*Delivery Charge:* ৳${order.delivery_charge}\n` +
      `*Total Amount:* ৳${order.grand_total}\n` +
      `━━━━━━━━━━━━━━━━━━━\n` +
      `👤 *Customer Information:*\n` +
      `• Name: ${order.customer_name}\n` +
      `• Phone: ${order.mobile_number}` +
      (order.alternative_phone ? ` (Alt: ${order.alternative_phone})` : '') +
      `\n` +
      `• District: ${order.district}\n` +
      `• Thana/Upazila: ${order.thana_upazila || 'N/A'}\n` +
      `• Area/Village: ${order.area_village || 'N/A'}\n` +
      `• Full Address: ${order.full_address}\n` +
      (order.delivery_note ? `• Delivery Note: ${order.delivery_note}\n` : '') +
      `━━━━━━━━━━━━━━━━━━━\n` +
      `📅 *Date:* ${new Date(order.created_at).toLocaleString('bn-BD', { timeZone: 'Asia/Dhaka' })}\n` +
      `⚡ *Action Required:* Please verify inventory and prepare for packing.`;

    const messageId = 'wamid.' + Date.now() + '.' + Math.random().toString(36).substring(2, 8);

    // Save message to simulated WhatsApp group feed
    const groupMessage: WhatsAppGroupMessage = {
      id: messageId,
      groupId: orderGroupId,
      groupName: 'Group 2 — Order Notification Group',
      sender: 'Ghorer Shopping Sales AI',
      senderNumber: '+8801819000000',
      text: formattedMessage,
      imageUrl: firstProductImage,
      metadata: {
        order_id: order.order_id,
        customer_phone: order.mobile_number,
        total: order.grand_total,
      },
      timestamp: new Date().toISOString(),
      deliveryStatus: 'delivered',
    };

    this.groupMessages.push(groupMessage);

    // If real WhatsApp Cloud API token is configured, also post to Meta Graph API
    let externalSuccess = true;
    let externalError: string | undefined;

    if (
      settings.whatsapp.access_token &&
      settings.whatsapp.phone_number_id &&
      !settings.whatsapp.access_token.includes('EAAG...WhatsAppCloudAPIToken')
    ) {
      try {
        const url = `https://graph.facebook.com/v19.0/${settings.whatsapp.phone_number_id}/messages`;
        const payload: any = {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: orderGroupId,
          type: 'text',
          text: { body: formattedMessage },
        };

        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${settings.whatsapp.access_token}`,
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errData = await res.text();
          externalError = `WhatsApp API Error ${res.status}: ${errData}`;
          externalSuccess = false;
        }
      } catch (err: any) {
        externalError = err.message;
        externalSuccess = false;
      }
    }

    // Update order notification status in database
    const orderInDb = db.getOrderById(order.id);
    if (orderInDb) {
      orderInDb.whatsapp_notification_sent = true;
      orderInDb.whatsapp_notification_status = externalSuccess ? 'sent' : 'failed';
      orderInDb.whatsapp_message_id = messageId;
      orderInDb.whatsapp_notification_error = externalError;
    }

    db.log(
      'WhatsApp',
      externalSuccess ? 'success' : 'warn',
      `Sent Order Notification for ${order.order_id} to WhatsApp Group`,
      { order_id: order.order_id, messageId, externalSuccess, externalError }
    );

    return {
      success: true,
      messageId,
      error: externalError,
    };
  }

  /**
   * Broadcast newly uploaded product with its image directly to Group 1 (Product Management Group)
   */
  public async broadcastNewProduct(product: Product, addedBy = 'Admin Web Dashboard'): Promise<void> {
    const settings = db.getSettings();
    const productGroupId = settings.whatsapp.product_management_group_id || '120363098765432101@g.us';

    const measurements = [
      product.kameez_length ? `কামিজ ${product.kameez_length}` : '',
      product.salwar_length ? `সেলোয়ার ${product.salwar_length}` : '',
      product.orna_length ? `ওড়না ${product.orna_length}` : '',
    ]
      .filter(Boolean)
      .join(', ');

    const priceText = product.discount_price
      ? `৳${product.price} (ডিসকাউন্ট: ৳${product.discount_price})`
      : `৳${product.price}`;

    const formattedMessage =
      `👗 *NEW PRODUCT ADDED TO CATALOG*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `*Product Code:* \`${product.product_id}\`\n` +
      `*Product Name:* ${product.product_name}\n` +
      `*Price:* ${priceText}\n` +
      `*Stock Quantity:* ${product.stock} পিস\n` +
      `*Available Colors:* ${product.colors.join(', ')}\n` +
      `*Fabric:* ${product.fabric}\n` +
      `*Size:* ${product.size}\n` +
      (measurements ? `*Measurements:* ${measurements}\n` : '') +
      `*Status:* 🟢 ${product.status.toUpperCase()}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `📌 *Description:* ${product.description}\n` +
      `🚚 *Delivery:* ${product.delivery_info}\n` +
      `👤 *Uploaded By:* ${addedBy}\n` +
      `📅 *Date:* ${new Date(product.created_at).toLocaleString('bn-BD', { timeZone: 'Asia/Dhaka' })}\n` +
      `⚡ *AI Agent Notice:* এই প্রোডাক্টটি লাইভ ডাটাবেজে যুক্ত হয়েছে এবং AI সেলস এজেন্ট এখন থেকে কাস্টমারদের এই প্রোডাক্ট অফার করতে পারবে।`;

    const messageId = 'wa-prod-notif-' + Date.now();
    const primaryImage = product.images?.[0]?.image_url;

    // Push to simulated Group 1 feed
    this.groupMessages.push({
      id: messageId,
      groupId: productGroupId,
      groupName: 'Group 1 — Product Management Group',
      sender: 'Catalog Manager Bot',
      senderNumber: '+8801819000000',
      text: formattedMessage,
      imageUrl: primaryImage,
      metadata: {
        product_id: product.product_id,
        price: product.price,
        stock: product.stock,
      },
      timestamp: new Date().toISOString(),
      deliveryStatus: 'delivered',
    });

    // Send to Meta WhatsApp Cloud API if configured
    if (
      settings.whatsapp.access_token &&
      settings.whatsapp.phone_number_id &&
      !settings.whatsapp.access_token.includes('EAAG...WhatsAppCloudAPIToken')
    ) {
      try {
        const url = `https://graph.facebook.com/v19.0/${settings.whatsapp.phone_number_id}/messages`;
        await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${settings.whatsapp.access_token}`,
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: productGroupId,
            type: 'text',
            text: { body: formattedMessage },
          }),
        });
      } catch (err: any) {
        db.log('WhatsApp', 'warn', `Failed to send new product to WhatsApp Cloud API: ${err.message}`);
      }
    }

    db.log('WhatsApp', 'success', `Product ${product.product_id} (${product.product_name}) published to WhatsApp Product Group 1.`);
  }

  /**
   * Process incoming WhatsApp group message or command for Product Management Group (Group 1)
   */
  public handleProductManagementCommand(
    senderPhone: string,
    senderName: string,
    text: string
  ): { reply: string; actionExecuted?: string; product?: Product } {
    // 1. Check authorization
    const isAuthorized = db.isAuthorizedWhatsAppAdmin(senderPhone);
    if (!isAuthorized) {
      const deniedMsg = `⛔ *Unauthorized Access Denied*\nPhone ${senderPhone} is not an authorized WhatsApp admin for Ghorer Shopping.`;
      db.log('WhatsApp', 'warn', `Unauthorized WhatsApp command attempt from ${senderPhone}`);
      return { reply: deniedMsg };
    }

    const trimmed = text.trim();
    const parts = trimmed.split(' ');
    const command = parts[0].toLowerCase();

    const groupId = db.getSettings().whatsapp.product_management_group_id || '120363098765432101@g.us';

    // Record incoming admin message in feed
    this.groupMessages.push({
      id: 'wa-cmd-' + Date.now(),
      groupId,
      groupName: 'Group 1 — Product Management Group',
      sender: senderName,
      senderNumber: senderPhone,
      text: trimmed,
      timestamp: new Date().toISOString(),
      deliveryStatus: 'delivered',
    });

    // 2. Command: /list
    if (command === '/list' || command === 'list') {
      const products = db.getProducts();
      let msg = `📋 *Ghorer Shopping Product Catalog (${products.length} Items)*\n━━━━━━━━━━━━━━━━━━━━\n`;
      products.forEach((p, idx) => {
        msg += `${idx + 1}. *${p.product_name}*\n`;
        msg += `   • Code: \`${p.product_id}\`\n`;
        msg += `   • Price: ৳${p.price}` + (p.discount_price ? ` (Dis: ৳${p.discount_price})` : '') + `\n`;
        msg += `   • Stock: ${p.stock} পিস | Status: ${p.status === 'active' ? '🟢 Active' : p.status === 'out_of_stock' ? '🔴 Out of Stock' : '⚪ Inactive'}\n`;
        msg += `   • Colors: ${p.colors.join(', ')}\n\n`;
      });
      this.sendGroupReply(groupId, msg);
      return { reply: msg, actionExecuted: 'LIST_PRODUCTS' };
    }

    // 3. Command: /stock [CODE] [QTY]
    if (command === '/stock' || command === 'stock') {
      const code = parts[1];
      const qty = parseInt(parts[2], 10);
      if (!code || isNaN(qty)) {
        const err = `❌ Invalid format. Use: \`/stock [PRODUCT_CODE] [QUANTITY]\`\nExample: \`/stock GS-BTK-01 35\``;
        this.sendGroupReply(groupId, err);
        return { reply: err };
      }
      const updated = db.updateStock(code, qty, `${senderName} (${senderPhone})`);
      if (!updated) {
        const notFound = `❌ Product with code "${code}" not found.`;
        this.sendGroupReply(groupId, notFound);
        return { reply: notFound };
      }
      const successMsg = `✅ *Stock Updated Successfully*\n• Product: ${updated.product_name}\n• Code: \`${updated.product_id}\`\n• New Stock: *${updated.stock} পিস*\n• Status: ${updated.status}`;
      this.sendGroupReply(groupId, successMsg);
      return { reply: successMsg, actionExecuted: 'UPDATE_STOCK', product: updated };
    }

    // 4. Command: /price [CODE] [PRICE] [DISCOUNT_PRICE?]
    if (command === '/price' || command === 'price') {
      const code = parts[1];
      const price = parseFloat(parts[2]);
      const discount = parts[3] ? parseFloat(parts[3]) : undefined;
      if (!code || isNaN(price)) {
        const err = `❌ Invalid format. Use: \`/price [CODE] [PRICE] [OPTIONAL_DISCOUNT]\`\nExample: \`/price GS-BTK-01 1500 1290\``;
        this.sendGroupReply(groupId, err);
        return { reply: err };
      }
      const updated = db.updatePrice(code, price, discount, `${senderName} (${senderPhone})`);
      if (!updated) {
        const notFound = `❌ Product with code "${code}" not found.`;
        this.sendGroupReply(groupId, notFound);
        return { reply: notFound };
      }
      const successMsg = `✅ *Price Updated Successfully*\n• Product: ${updated.product_name}\n• Code: \`${updated.product_id}\`\n• Regular Price: ৳${updated.price}\n• Discount Price: ${updated.discount_price ? '৳' + updated.discount_price : 'None'}`;
      this.sendGroupReply(groupId, successMsg);
      return { reply: successMsg, actionExecuted: 'UPDATE_PRICE', product: updated };
    }

    // 5. Command: /toggle [CODE]
    if (command === '/toggle' || command === 'toggle') {
      const code = parts[1];
      const prod = db.getProductById(code);
      if (!prod) {
        const notFound = `❌ Product "${code}" not found.`;
        this.sendGroupReply(groupId, notFound);
        return { reply: notFound };
      }
      const newStatus = prod.status === 'active' ? 'inactive' : 'active';
      const updated = db.updateProduct(prod.id, { status: newStatus }, `${senderName} (${senderPhone})`);
      const msg = `🔄 *Product Status Changed*\n• ${prod.product_name} is now: *${newStatus.toUpperCase()}*`;
      this.sendGroupReply(groupId, msg);
      return { reply: msg, actionExecuted: 'TOGGLE_STATUS', product: updated! };
    }

    // 6. Command: /search [QUERY]
    if (command === '/search' || command === 'search') {
      const q = parts.slice(1).join(' ');
      const results = db.searchProducts(q);
      if (results.length === 0) {
        const none = `🔍 No products matching "${q}" found in database.`;
        this.sendGroupReply(groupId, none);
        return { reply: none };
      }
      let msg = `🔍 *Search Results for "${q}" (${results.length} found):*\n\n`;
      results.forEach((p) => {
        msg += `• *${p.product_name}* (\`${p.product_id}\`)\n  Price: ৳${p.discount_price || p.price} | Stock: ${p.stock} | Colors: ${p.colors.join(', ')}\n\n`;
      });
      this.sendGroupReply(groupId, msg);
      return { reply: msg, actionExecuted: 'SEARCH' };
    }

    // Default help
    const help =
      `ℹ️ *Available Commands in Product Management Group:*\n` +
      `• \`/list\` — View all products\n` +
      `• \`/stock [CODE] [QTY]\` — Update stock\n` +
      `• \`/price [CODE] [PRICE] [DISCOUNT]\` — Update price\n` +
      `• \`/toggle [CODE]\` — Activate / Deactivate product\n` +
      `• \`/search [QUERY]\` — Find products in database`;
    this.sendGroupReply(groupId, help);
    return { reply: help };
  }

  private sendGroupReply(groupId: string, text: string) {
    this.groupMessages.push({
      id: 'wa-rep-' + Date.now(),
      groupId,
      groupName:
        groupId.includes('102') ? 'Group 2 — Order Notification Group' : 'Group 1 — Product Management Group',
      sender: 'System Admin Bot',
      senderNumber: '+8801819000000',
      text,
      timestamp: new Date().toISOString(),
      deliveryStatus: 'delivered',
    });
  }
}

export const whatsAppService = new WhatsAppService();
