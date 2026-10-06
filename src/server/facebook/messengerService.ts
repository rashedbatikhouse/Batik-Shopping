import { db } from '../db/database.ts';
import { geminiAgent } from '../ai/gemini.ts';

export class FacebookMessengerService {
  /**
   * Verify Facebook Webhook endpoint (GET /api/webhook/facebook)
   */
  public verifyWebhook(mode: string, token: string, challenge: string): { status: number; body: string } {
    const settings = db.getSettings();
    const expectedToken = settings.facebook.verify_token;

    if (mode === 'subscribe' && token === expectedToken) {
      db.log('Facebook', 'info', 'Facebook Webhook verified successfully');
      return { status: 200, body: challenge };
    }

    db.log('Facebook', 'warn', `Facebook Webhook verification failed. Token mismatch: ${token}`);
    return { status: 403, body: 'Verification token mismatch' };
  }

  /**
   * Handle incoming Facebook Messenger webhook event (POST /api/webhook/facebook)
   */
  public async handleWebhookEvent(body: any): Promise<void> {
    if (body.object !== 'page') return;

    for (const entry of body.entry || []) {
      for (const event of entry.messaging || []) {
        const senderPsid = event.sender?.id;
        const messageText = event.message?.text;

        if (senderPsid && messageText) {
          db.log('Facebook', 'info', `Incoming Messenger message from PSID: ${senderPsid}: "${messageText}"`);

          const conv = db.getOrCreateConversation({
            facebook_psid: senderPsid,
            platform: 'facebook',
          });

          // Save customer message
          db.addMessage(conv.id, 'customer', messageText);

          // Process through AI
          const aiResponse = await geminiAgent.processCustomerMessage({
            conversationId: conv.id,
            messageText,
            platform: 'facebook',
            facebookPsid: senderPsid,
          });

          // Save AI reply
          db.addMessage(conv.id, 'ai', aiResponse.reply, aiResponse.imageUrl, aiResponse.orderSummary);

          // Dispatch to Facebook Send API if configured
          await this.sendFacebookMessage(senderPsid, aiResponse.reply, aiResponse.imageUrl);
        }
      }
    }
  }

  /**
   * Dispatch reply to Facebook Graph API
   */
  public async sendFacebookMessage(recipientPsid: string, text: string, imageUrl?: string): Promise<boolean> {
    const settings = db.getSettings();
    const token = settings.facebook.page_access_token;

    if (!token || token.includes('EAAG...GhorerShoppingToken')) {
      // Mock / Dev mode
      return true;
    }

    try {
      const url = `https://graph.facebook.com/v19.0/me/messages?access_token=${token}`;

      // If image exists, send image first or attach
      if (imageUrl) {
        await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipient: { id: recipientPsid },
            message: {
              attachment: {
                type: 'image',
                payload: { url: imageUrl, is_reusable: true },
              },
            },
          }),
        });
      }

      // Send text
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: { id: recipientPsid },
          message: { text },
        }),
      });

      return res.ok;
    } catch (err: any) {
      db.log('Facebook', 'error', `Failed to send Facebook message: ${err.message}`, err);
      return false;
    }
  }
}

export const messengerService = new FacebookMessengerService();
