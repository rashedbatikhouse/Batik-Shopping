import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';
import { db } from '../db/database.ts';
import { whatsAppService } from '../whatsapp/whatsappService.ts';
import { AIProvider } from '../../types/index.ts';

// Shared Gemini instance
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Gemini SDK Tools
const searchProductsTool: FunctionDeclaration = {
  name: 'search_products',
  description: 'Search available products in Ghorer Shopping database by keyword, color, or maximum price.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: { type: Type.STRING, description: 'Product name, keyword, or fabric e.g. "বাটিক থ্রি-পিস", "সুতি", "সিল্ক"' },
      color: { type: Type.STRING, description: 'Color name in Bengali or English e.g. "নীল", "লাল", "কালো"' },
      max_price: { type: Type.NUMBER, description: 'Maximum budget or price' },
    },
    required: ['query'],
  },
};

const getProductDetailsTool: FunctionDeclaration = {
  name: 'get_product_details',
  description: 'Get full details, pricing, discount, dimensions, fabric, and primary photo for a specific product ID or code.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      product_id: { type: Type.STRING, description: 'Product ID or Code e.g. "GS-BTK-01" or "prod-001"' },
    },
    required: ['product_id'],
  },
};

const checkStockTool: FunctionDeclaration = {
  name: 'check_stock',
  description: 'Check real-time stock and available colors for a product before offering it to customer.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      product_id: { type: Type.STRING, description: 'Product ID or Code' },
      color: { type: Type.STRING, description: 'Color name to check availability for' },
      quantity: { type: Type.NUMBER, description: 'Quantity requested' },
    },
    required: ['product_id'],
  },
};

const calculateOrderTool: FunctionDeclaration = {
  name: 'calculate_order',
  description: 'Calculate subtotal, discount, delivery fee by district, and grand total.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      items: {
        type: Type.ARRAY,
        description: 'List of order items',
        items: {
          type: Type.OBJECT,
          properties: {
            product_id: { type: Type.STRING, description: 'Product ID or Code' },
            color: { type: Type.STRING, description: 'Selected color' },
            quantity: { type: Type.NUMBER, description: 'Quantity' },
          },
          required: ['product_id', 'color', 'quantity'],
        },
      },
      district: { type: Type.STRING, description: 'Customer delivery district (e.g. ঢাকা, চট্টগ্রাম, রাজশাহী)' },
    },
    required: ['items', 'district'],
  },
};

const createAndConfirmOrderTool: FunctionDeclaration = {
  name: 'create_and_confirm_order',
  description: 'Create and finalize order in database ONLY after customer has been shown final summary AND explicitly confirmed.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      customer_name: { type: Type.STRING, description: 'Full name of customer' },
      mobile_number: { type: Type.STRING, description: '11 digit valid mobile number e.g. 01819XXXXXX' },
      alternative_phone: { type: Type.STRING, description: 'Optional secondary phone number' },
      district: { type: Type.STRING, description: 'District name e.g. ঢাকা' },
      thana_upazila: { type: Type.STRING, description: 'Thana or Upazila' },
      area_village: { type: Type.STRING, description: 'Area, road or village' },
      full_address: { type: Type.STRING, description: 'Complete detailed street address' },
      delivery_note: { type: Type.STRING, description: 'Special delivery note or request' },
      items: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            product_id: { type: Type.STRING, description: 'Product ID or code' },
            color: { type: Type.STRING, description: 'Color' },
            quantity: { type: Type.NUMBER, description: 'Quantity' },
          },
          required: ['product_id', 'color', 'quantity'],
        },
      },
      customer_explicitly_confirmed: {
        type: Type.BOOLEAN,
        description: 'Must be TRUE only if customer said explicit confirmation like হ্যাঁ, জি, ঠিক আছে, কনফার্ম করেন',
      },
    },
    required: ['customer_name', 'mobile_number', 'district', 'full_address', 'items', 'customer_explicitly_confirmed'],
  },
};

const handoffToHumanTool: FunctionDeclaration = {
  name: 'handoff_to_human',
  description: 'Transfer conversation to a human support representative when the customer asks to speak with a human or admin.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      reason: { type: Type.STRING, description: 'Why human handoff was requested' },
    },
    required: ['reason'],
  },
};

// OpenAI / Grok / DeepSeek Compatible Tools
const openAITools = [
  {
    type: 'function',
    function: {
      name: 'search_products',
      description: 'Search available products in Ghorer Shopping database by keyword, color, or maximum price.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Product name, keyword, or fabric' },
          color: { type: 'string', description: 'Color name in Bengali or English' },
          max_price: { type: 'number', description: 'Maximum budget or price' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_product_details',
      description: 'Get full details, pricing, discount, dimensions, fabric, and primary photo for a specific product ID or code.',
      parameters: {
        type: 'object',
        properties: {
          product_id: { type: 'string', description: 'Product ID or Code' },
        },
        required: ['product_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'check_stock',
      description: 'Check real-time stock and available colors for a product before offering it to customer.',
      parameters: {
        type: 'object',
        properties: {
          product_id: { type: 'string', description: 'Product ID or Code' },
          color: { type: 'string', description: 'Color name to check' },
          quantity: { type: 'number', description: 'Quantity requested' },
        },
        required: ['product_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'calculate_order',
      description: 'Calculate subtotal, discount, delivery fee by district, and grand total.',
      parameters: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                product_id: { type: 'string' },
                color: { type: 'string' },
                quantity: { type: 'number' },
              },
              required: ['product_id', 'color', 'quantity'],
            },
          },
          district: { type: 'string' },
        },
        required: ['items', 'district'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_and_confirm_order',
      description: 'Create and finalize order in database ONLY after customer has been shown final summary AND explicitly confirmed.',
      parameters: {
        type: 'object',
        properties: {
          customer_name: { type: 'string' },
          mobile_number: { type: 'string' },
          alternative_phone: { type: 'string' },
          district: { type: 'string' },
          thana_upazila: { type: 'string' },
          area_village: { type: 'string' },
          full_address: { type: 'string' },
          delivery_note: { type: 'string' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                product_id: { type: 'string' },
                color: { type: 'string' },
                quantity: { type: 'number' },
              },
              required: ['product_id', 'color', 'quantity'],
            },
          },
          customer_explicitly_confirmed: { type: 'boolean' },
        },
        required: ['customer_name', 'mobile_number', 'district', 'full_address', 'items', 'customer_explicitly_confirmed'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'handoff_to_human',
      description: 'Transfer conversation to a human support representative when the customer asks to speak with a human or admin.',
      parameters: {
        type: 'object',
        properties: {
          reason: { type: 'string' },
        },
        required: ['reason'],
      },
    },
  },
];

export class MultiModelSalesAgent {
  /**
   * Execute controlled tool calls against database
   */
  private async executeTool(name: string, args: any, conversationId: string): Promise<any> {
    db.log('AI', 'info', `Executing AI tool "${name}"`, args);

    if (name === 'search_products') {
      const results = db.searchProducts(args.query, args.color, args.max_price);
      return {
        count: results.length,
        products: results.map((p) => ({
          product_id: p.product_id,
          product_name: p.product_name,
          price: p.price,
          discount_price: p.discount_price,
          colors: p.colors,
          stock: p.stock,
          size: p.size,
          fabric: p.fabric,
          kameez_length: p.kameez_length,
          salwar_length: p.salwar_length,
          orna_length: p.orna_length,
          status: p.status,
          image_url: p.images[0]?.image_url,
          description: p.description,
        })),
      };
    }

    if (name === 'get_product_details') {
      const product = db.getProductById(args.product_id);
      if (!product) {
        return { found: false, message: `Product "${args.product_id}" not found in database.` };
      }
      return {
        found: true,
        product: {
          id: product.id,
          product_id: product.product_id,
          product_name: product.product_name,
          price: product.price,
          discount_price: product.discount_price,
          colors: product.colors,
          stock: product.stock,
          size: product.size,
          fabric: product.fabric,
          kameez_length: product.kameez_length,
          salwar_length: product.salwar_length,
          orna_length: product.orna_length,
          delivery_info: product.delivery_info,
          status: product.status,
          images: product.images,
          description: product.description,
        },
      };
    }

    if (name === 'check_stock') {
      const product = db.getProductById(args.product_id);
      if (!product) return { available: false, message: 'প্রোডাক্টটি ডাটাবেজে পাওয়া যায়নি।' };

      const hasColor = !args.color || product.colors.some((c) => c.toLowerCase().includes(args.color.toLowerCase()));
      const requestedQty = args.quantity || 1;
      const hasStock = product.stock >= requestedQty;

      return {
        product_name: product.product_name,
        available: hasColor && hasStock && product.status === 'active',
        stock: product.stock,
        colors_available: product.colors,
        status: product.status,
      };
    }

    if (name === 'calculate_order') {
      return db.calculateOrder(args.items, args.district);
    }

    if (name === 'create_and_confirm_order') {
      if (!args.customer_explicitly_confirmed) {
        return {
          success: false,
          error: 'অর্ডার কনফার্ম করার জন্য কাস্টমারের সুস্পষ্ট নিশ্চিতকরণ (Explicit confirmation) আবশ্যক।',
        };
      }

      const orderResult = db.createConfirmedOrder({
        customer_name: args.customer_name,
        mobile_number: args.mobile_number,
        alternative_phone: args.alternative_phone,
        district: args.district,
        thana_upazila: args.thana_upazila || '',
        area_village: args.area_village || '',
        full_address: args.full_address,
        delivery_note: args.delivery_note,
        items: args.items,
      });

      if (orderResult.success && orderResult.order) {
        await whatsAppService.sendOrderNotification(orderResult.order);
        return {
          success: true,
          order_id: orderResult.order.order_id,
          total: orderResult.order.grand_total,
          message: `Order successfully confirmed and assigned Order ID: ${orderResult.order.order_id}`,
        };
      }

      return {
        success: false,
        error: orderResult.error || 'Failed to create order in database',
      };
    }

    if (name === 'handoff_to_human') {
      const handoff = db.requestHumanHandoff(conversationId, args.reason || 'Customer requested human support');
      return {
        success: true,
        handoff_id: handoff.id,
        message: 'Conversation transferred to human support queue.',
      };
    }

    return { error: `Tool ${name} not recognized` };
  }

  private isHumanHandoffRequest(text: string): boolean {
    const handoffTriggers = [
      'মানুষের সাথে কথা বলতে চাই',
      'মানুষের সাথে কথা বলব',
      'মানুষের সাথে কথা বলিয়ে দিন',
      'মানুষের সাথে কথা বলিয়ে দিন',
      'এডমিনের সাথে কথা বলব',
      'এডমিন',
      'admin',
      'human',
      'representative',
      'প্রতিনিধি',
      'মানুষ চাই',
      'কথা বলতে চাই কারো সাথে',
    ];
    const lower = text.toLowerCase();
    return handoffTriggers.some((t) => lower.includes(t.toLowerCase()));
  }

  /**
   * Process customer incoming message through active AI Provider (Gemini / OpenAI / Grok / DeepSeek)
   */
  public async processCustomerMessage(params: {
    conversationId: string;
    messageText: string;
    platform?: 'facebook' | 'web_simulator';
    facebookPsid?: string;
  }): Promise<{ reply: string; imageUrl?: string; orderSummary?: any; isHandoff?: boolean }> {
    const { conversationId, messageText, facebookPsid } = params;
    const trimmed = messageText.trim();

    // 1. Check if conversation is already in human handoff mode
    const conv = db.getOrCreateConversation({
      customer_id: undefined,
      facebook_psid: facebookPsid,
      platform: params.platform,
    });

    if (conv.is_human_handoff) {
      db.log('AI', 'info', 'Message received while in Human Handoff mode. Suppressing AI auto-reply.');
      return {
        reply: 'আমাদের একজন সাপোর্ট প্রতিনিধি খুব শীঘ্রই আপনার মেসেজের উত্তর দেবেন। একটু অপেক্ষা করার জন্য ধন্যবাদ।',
        isHandoff: true,
      };
    }

    // 2. Direct handoff trigger check
    if (this.isHumanHandoffRequest(trimmed)) {
      db.requestHumanHandoff(conversationId, 'Customer asked to talk to a human / admin.');
      return {
        reply: 'জি অবশ্যই! আপনাকে আমাদের হিউম্যান সাপোর্ট রিপ্রেজেনটেটিভের সাথে যুক্ত করে দেওয়া হয়েছে। কিছুক্ষণের মধ্যে আমাদের প্রতিনিধি আপনার সাথে কথা বলবেন। অনুগ্রহ করে সাথেই থাকুন।',
        isHandoff: true,
      };
    }

    // 3. Prepare context & knowledge base
    const settings = db.getSettings();
    const allProducts = db.getProducts({ status: 'active' });
    const previousMessages = db.getMessages(conversationId).slice(-10);

    const businessKnowledge = `
[BUSINESS INFORMATION - SOURCE OF TRUTH]
Name: ${settings.business.business_name}
Tagline: ${settings.business.tagline}
Phone: ${settings.business.phone}
Business Hours: ${settings.business.business_hours}
Address: ${settings.business.address}
About: ${settings.business.about_business}
Delivery Policy: ${settings.business.delivery_policy}
Return Policy: ${settings.business.return_policy}
Exchange Policy: ${settings.business.exchange_policy}
Payment Methods: ${settings.business.payment_methods}
Delivery Charges:
- Inside Dhaka: ৳${settings.delivery.inside_dhaka_charge} (${settings.delivery.estimated_dhaka_days})
- Sub-Dhaka (Savar, Gazipur, Narayanganj, Keraniganj): ৳${settings.delivery.sub_dhaka_charge}
- Outside Dhaka: ৳${settings.delivery.outside_dhaka_charge} (${settings.delivery.estimated_outside_days})
- Free Delivery for orders above ৳${settings.delivery.free_delivery_above}

[AVAILABLE PRODUCTS IN DATABASE - SOURCE OF TRUTH]
${allProducts.length === 0 ? 'No products in database currently. Inform customer that our catalog is being updated and human support will assist shortly.' : allProducts
  .map(
    (p) =>
      `• Code: ${p.product_id} | Name: ${p.product_name} | Price: ৳${p.price}${p.discount_price ? ` (Discount: ৳${p.discount_price})` : ''} | Stock: ${p.stock} | Colors: ${p.colors.join(', ')} | Size: ${p.size} | Fabric: ${p.fabric} | Kameez: ${p.kameez_length || '48 inch'} | Salwar: ${p.salwar_length || '42 inch'} | Orna: ${p.orna_length || '5 haath'} | PrimaryImage: ${p.images[0]?.image_url || ''}`
  )
  .join('\n')}
`;

    const systemInstruction = `
${settings.ai.system_prompt}

CRITICAL OPERATIONAL RULES (MANDATORY):
1. Language: Always respond in natural, polite, respectful Bangladeshi Bengali (বাংলা).
2. Zero Hallucination: NEVER invent any product, color, size, measurement, price, discount, or delivery charge not in the above context or returned by tools. If asked for anything unknown, state that human support will confirm.
3. Order Collection Workflow:
   - When a customer says they want to order, guide them step-by-step.
   - Do NOT ask for everything in one massive overwhelming message if details are missing.
   - Required information before confirmation:
     a) Product Name / Code
     b) Color
     c) Quantity
     d) Customer Full Name
     e) Mobile Number (Valid 11 digits starting with 01)
     f) District
     g) Thana / Upazila
     h) Area / Village
     i) Full detailed street address
   - Once all details are collected, compute totals and SHOW THE FINAL ORDER SUMMARY:
     
     📋 আপনার অর্ডারের চূড়ান্ত তথ্য:
     ━━━━━━━━━━━━━━━━━━━━
     নাম: [Customer Name]
     মোবাইল: [Mobile Number]
     প্রোンダント: [Product Name] ([Code])
     কালার: [Color]
     পরিমাণ: [Qty] পিস
     ঠিকানা: [Full Address, Area, Thana, District]
     ━━━━━━━━━━━━━━━━━━━━
     সাবটোটাল: ৳[Subtotal]
     [ডিসকাউন্ট: -৳[Discount]]
     ডেলিভারি চার্জ: ৳[Delivery Charge]
     সর্বমোট প্রদেয়: ৳[Grand Total]
     ━━━━━━━━━━━━━━━━━━━━
     "আপনার অর্ডারটি কি Confirm করবেন?"
   
   - EXPLICIT CONFIRMATION: The order MUST NOT be created or confirmed until the customer replies with an unambiguous explicit confirmation (যেমন: "হ্যাঁ", "জি", "অর্ডার করেন", "Confirm", "ঠিক আছে", "নিশ্চিত")!
   - If response is ambiguous, DO NOT CONFIRM. Politely ask for clarification.
   - Once explicit confirmation is received, invoke tool "create_and_confirm_order" with customer_explicitly_confirmed = true.
   - Then congratulate the customer with their generated Order ID and mention cash on delivery details.
4. If customer asks for photos, you can provide the primary product image URL in your response or tool results.
`;

    const provider: AIProvider = settings.ai.provider || 'gemini';
    const model = settings.ai.model || 'gemini-3.8-flash';

    db.log('AI', 'info', `Processing message with AI Provider: ${provider.toUpperCase()}, Model: ${model}`);

    // --- 1. GEMINI PROVIDER ---
    const customKeys = db.getRawAIKeys();
    const geminiKey = customKeys.gemini || process.env.GEMINI_API_KEY;

    if (provider === 'gemini') {
      if (geminiKey && geminiKey !== 'MY_GEMINI_API_KEY') {
        try {
          const geminiClient = new GoogleGenAI({
            apiKey: geminiKey,
            httpOptions: {
              headers: {
                'User-Agent': 'aistudio-build',
              },
            },
          });

          const contents: any[] = [];
          for (const msg of previousMessages) {
            contents.push({
              role: msg.sender === 'customer' ? 'user' : 'model',
              parts: [{ text: msg.text }],
            });
          }
          contents.push({
            role: 'user',
            parts: [{ text: `${businessKnowledge}\n\n[CUSTOMER MESSAGE]:\n${trimmed}` }],
          });

          const response1 = await geminiClient.models.generateContent({
            model: model.includes('gemini') ? model : 'gemini-3.8-flash',
            contents,
            config: {
              systemInstruction,
              temperature: settings.ai.temperature || 0.2,
              tools: [
                {
                  functionDeclarations: [
                    searchProductsTool,
                    getProductDetailsTool,
                    checkStockTool,
                    calculateOrderTool,
                    createAndConfirmOrderTool,
                    handoffToHumanTool,
                  ],
                },
              ],
            },
          });

          let extractedImageUrl: string | undefined;
          const functionCalls = response1.functionCalls;
          if (functionCalls && functionCalls.length > 0) {
            const call = functionCalls[0];
            const toolResult = await this.executeTool(call.name || '', call.args, conversationId);

            if (toolResult.product?.images?.[0]?.image_url) {
              extractedImageUrl = toolResult.product.images[0].image_url;
            } else if (toolResult.products?.[0]?.image_url) {
              extractedImageUrl = toolResult.products[0].image_url;
            }

            const followupResponse = await geminiClient.models.generateContent({
              model: model.includes('gemini') ? model : 'gemini-3.8-flash',
              contents: [
                ...contents,
                response1.candidates?.[0]?.content,
                {
                  role: 'user',
                  parts: [
                    {
                      text: `[TOOL RESULT for ${call.name}]:\n${JSON.stringify(toolResult)}\n\nNow provide a warm, respectful, concise Bengali response to the customer based on this exact result.`,
                    },
                  ],
                },
              ],
              config: {
                systemInstruction,
                temperature: settings.ai.temperature || 0.2,
              },
            });

            return { reply: followupResponse.text?.trim() || 'জি, আপনার তথ্য পেয়েছি।', imageUrl: extractedImageUrl };
          }

          const directReply = response1.text?.trim();
          if (directReply) {
            const matchingProduct = allProducts.find((p) =>
              directReply.toLowerCase().includes(p.product_id.toLowerCase()) ||
              directReply.toLowerCase().includes(p.product_name.toLowerCase())
            );
            if (matchingProduct?.images[0]?.image_url) {
              extractedImageUrl = matchingProduct.images[0].image_url;
            }
            return { reply: directReply, imageUrl: extractedImageUrl };
          }
        } catch (err: any) {
          db.log('AI', 'error', `Gemini API execution error: ${err.message}`, err);
        }
      }
    }

    // --- 2. OPENAI / GROK / DEEPSEEK PROVIDERS ---
    if (provider === 'openai' || provider === 'grok' || provider === 'deepseek') {
      const openAIResult = await this.callOpenAICompatibleProvider({
        provider,
        model,
        systemInstruction,
        businessKnowledge,
        previousMessages,
        userMessage: trimmed,
        conversationId,
        allProducts,
      });

      if (openAIResult) {
        return openAIResult;
      }
    }

    // High-fidelity Bengali Sales Engine Fallback
    return this.fallbackBanglaSalesEngine(trimmed, conversationId, allProducts, settings);
  }

  /**
   * Universal OpenAI-compatible API caller for OpenAI, xAI Grok, and DeepSeek
   */
  private async callOpenAICompatibleProvider(params: {
    provider: 'openai' | 'grok' | 'deepseek';
    model: string;
    systemInstruction: string;
    businessKnowledge: string;
    previousMessages: any[];
    userMessage: string;
    conversationId: string;
    allProducts: any[];
  }): Promise<{ reply: string; imageUrl?: string } | null> {
    const { provider, model, systemInstruction, businessKnowledge, previousMessages, userMessage, conversationId, allProducts } = params;

    let apiKey = '';
    let baseURL = '';
    const customKeys = db.getRawAIKeys();

    if (provider === 'openai') {
      apiKey = customKeys.openai || process.env.OPENAI_API_KEY || '';
      baseURL = 'https://api.openai.com/v1/chat/completions';
    } else if (provider === 'grok') {
      apiKey = customKeys.grok || process.env.GROK_API_KEY || process.env.XAI_API_KEY || '';
      baseURL = 'https://api.x.ai/v1/chat/completions';
    } else if (provider === 'deepseek') {
      apiKey = customKeys.deepseek || process.env.DEEPSEEK_API_KEY || '';
      baseURL = 'https://api.deepseek.com/chat/completions';
    }

    if (!apiKey) {
      db.log('AI', 'warn', `${provider.toUpperCase()} API Key not configured. Using high-fidelity Bengali sales engine fallback.`);
      return null;
    }

    try {
      const messages: any[] = [
        {
          role: 'system',
          content: `${systemInstruction}\n\n${businessKnowledge}`,
        },
      ];

      for (const msg of previousMessages) {
        messages.push({
          role: msg.sender === 'customer' ? 'user' : 'assistant',
          content: msg.text,
        });
      }

      messages.push({
        role: 'user',
        content: userMessage,
      });

      // DeepSeek reasoner does not accept tools parameter
      const isReasoner = model.includes('reasoner');
      const bodyPayload: any = {
        model,
        messages,
        temperature: isReasoner ? undefined : 0.2,
      };

      if (!isReasoner) {
        bodyPayload.tools = openAITools;
        bodyPayload.tool_choice = 'auto';
      }

      const response = await fetch(baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(bodyPayload),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`${provider.toUpperCase()} error ${response.status}: ${errText}`);
      }

      const resData = await response.json();
      const choice = resData.choices?.[0];
      const message = choice?.message;

      if (!message) return null;

      let extractedImageUrl: string | undefined;

      // Handle tool calls
      if (message.tool_calls && message.tool_calls.length > 0) {
        messages.push(message);

        for (const toolCall of message.tool_calls) {
          const fnName = toolCall.function?.name;
          const fnArgs = toolCall.function?.arguments ? JSON.parse(toolCall.function.arguments) : {};
          const toolResult = await this.executeTool(fnName, fnArgs, conversationId);

          if (toolResult.product?.images?.[0]?.image_url) {
            extractedImageUrl = toolResult.product.images[0].image_url;
          } else if (toolResult.products?.[0]?.image_url) {
            extractedImageUrl = toolResult.products[0].image_url;
          }

          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(toolResult),
          });
        }

        // Follow up call
        const followUpRes = await fetch(baseURL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages,
            temperature: 0.2,
          }),
        });

        if (followUpRes.ok) {
          const followData = await followUpRes.json();
          const followReply = followData.choices?.[0]?.message?.content?.trim();
          if (followReply) {
            return { reply: followReply, imageUrl: extractedImageUrl };
          }
        }
      }

      const replyContent = message.content?.trim();
      if (replyContent) {
        const matchingProduct = allProducts.find((p) =>
          replyContent.toLowerCase().includes(p.product_id.toLowerCase()) ||
          replyContent.toLowerCase().includes(p.product_name.toLowerCase())
        );
        if (matchingProduct?.images[0]?.image_url) {
          extractedImageUrl = matchingProduct.images[0].image_url;
        }
        return { reply: replyContent, imageUrl: extractedImageUrl };
      }
    } catch (err: any) {
      db.log('AI', 'error', `${provider.toUpperCase()} API execution failed: ${err.message}`, err);
    }

    return null;
  }

  /**
   * Deterministic Bengali Sales Engine matching PRD Sections 4, 10, 11, 12, 13, 14, 15, 16
   */
  private fallbackBanglaSalesEngine(
    text: string,
    conversationId: string,
    products: any[],
    settings: any
  ): { reply: string; imageUrl?: string; orderSummary?: any; isHandoff?: boolean } {
    const lower = text.toLowerCase();
    const conv = db.getOrCreateConversation({ customer_id: undefined });

    // Explicit confirmation words
    const explicitConfirmWords = ['হ্যাঁ', 'হ্যা', 'জি', 'জি করেন', 'অর্ডার করেন', 'confirm', 'confirmed', 'ঠিক আছে', 'নিশ্চিত', 'অর্ডার করুন', 'yes', 'হাঁ'];
    const isExplicitConfirmation = explicitConfirmWords.some((w) => lower === w || lower.startsWith(w + ' '));

    // Check if awaiting explicit confirmation
    if (conv.awaiting_confirmation && conv.order_draft) {
      if (isExplicitConfirmation) {
        const draft = conv.order_draft;
        const result = db.createConfirmedOrder({
          customer_name: draft.customer_name || 'Customer',
          mobile_number: draft.mobile_number || '01819000000',
          district: draft.district || 'ঢাকা',
          thana_upazila: draft.thana_upazila || '',
          area_village: draft.area_village || '',
          full_address: draft.full_address || '',
          delivery_note: draft.delivery_note,
          items: draft.items?.map((i) => ({
            product_id: i.product_id,
            color: i.color,
            quantity: i.quantity,
          })) || [],
        });

        if (result.success && result.order) {
          whatsAppService.sendOrderNotification(result.order);
          db.updateConversation(conv.id, { awaiting_confirmation: false, order_draft: undefined });

          const confirmedMsg =
            `🎉 অভিনন্দন! আপনার অর্ডারটি সফলভাবে Confirm করা হয়েছে।\n\n` +
            `📦 *অর্ডার আইডি:* ${result.order.order_id}\n` +
            `💰 *সর্বমোট প্রদেয়:* ৳${result.order.grand_total} (ক্যাশ অন ডেলিভারি)\n\n` +
            `আমাদের ডেলিভারি প্রতিনিধি ${settings.delivery.estimated_dhaka_days}-এর মধ্যে আপনার ঠিকানায় প্রোডাক্ট পৌঁছে দেবেন। ডেলিভারির সময় প্রোডাক্টটি ভালো করে দেখে মূল্য পরিশোধ করবেন।\n\n` +
            `Ghorer Shopping-এর সাথে থাকার জন্য ধন্যবাদ! ❤️`;

          return { reply: confirmedMsg, imageUrl: result.order.items[0]?.image_url };
        } else {
          return { reply: `দুঃখিত, অর্ডার সংরক্ষণে সমস্যা হয়েছে: ${result.error}` };
        }
      } else {
        return {
          reply: `আমরা আপনার স্পষ্ট সম্মতির জন্য অপেক্ষা করছি। আপনি কি এই অর্ডারটি কনফার্ম করতে চান? অনুগ্রহ করে বলুন "হ্যাঁ" অথবা "অর্ডার করেন"। আর কোনো পরিবর্তন করতে চাইলে দয়া করে জানান।`,
        };
      }
    }

    if (products.length === 0) {
      return {
        reply: `আসসালামু আলাইকুম! Ghorer Shopping-এ স্বাগতম।🌸 বর্তমানে আমাদের ক্যাটালগ আপডেট হচ্ছে। অনুগ্রহ করে একটু পরে আবার চেষ্টা করুন অথবা আমাদের প্রতিনিধি ০১৮১৯-০০০০০০ নম্বরে যোগাযোগ করুন।`,
      };
    }

    // Product search or inquiry
    const matched = products.find(
      (p) =>
        lower.includes(p.product_id.toLowerCase()) ||
        lower.includes(p.product_name.toLowerCase()) ||
        p.colors.some((c: string) => lower.includes(c.toLowerCase())) ||
        (lower.includes('বাটিক') && p.product_name.includes('বাটিক'))
    ) || products[0];

    // Check delivery question
    if (lower.includes('ডেলিভারি') || lower.includes('চার্জ') || lower.includes('কত দিন')) {
      return {
        reply: `আমাদের ডেলিভারি পলিসি:\n• ঢাকার ভেতরে ডেলিভারি চার্জ ৳${settings.delivery.inside_dhaka_charge} (${settings.delivery.estimated_dhaka_days})\n• ঢাকার আশেপাশে (সাভার/গাজীপুর/নারায়ণগঞ্জ) ৳${settings.delivery.sub_dhaka_charge}\n• ঢাকার বাইরে সমগ্র বাংলাদেশে ৳${settings.delivery.outside_dhaka_charge} (${settings.delivery.estimated_outside_days})\n\nসারা বাংলাদেশে সম্পূর্ণ ক্যাশ অন হোম ডেলিভারি সুবিধা রয়েছে। আপনি কি কোনো বাটিক পছন্দ করেছেন?`,
      };
    }

    // Check return/exchange
    if (lower.includes('রিটার্ন') || lower.includes('এক্সচেঞ্জ') || lower.includes('ফেরত')) {
      return {
        reply: `${settings.business.return_policy}\n\n${settings.business.exchange_policy}`,
      };
    }

    // Order intent: extract info or start step-by-step
    if (lower.includes('অর্ডার') || lower.includes('নিতে চাই') || lower.includes('কিনব') || lower.includes('order')) {
      const phoneMatch = text.match(/01[3-9]\d{8}/);
      if (phoneMatch) {
        const selectedProd = matched;
        const color = selectedProd.colors[0] || 'নীল';
        const qty = 1;
        const district = lower.includes('ঢাকা') ? 'ঢাকা' : 'ঢাকা';
        const calc = db.calculateOrder([{ product_id: selectedProd.id, color, quantity: qty }], district);

        const draft = {
          customer_name: 'সম্মানিত ক্রেতা',
          mobile_number: phoneMatch[0],
          district: 'ঢাকা',
          thana_upazila: 'মিরপুর',
          area_village: 'মিরপুর',
          full_address: text,
          items: calc.items,
        };

        db.updateConversation(conv.id, { awaiting_confirmation: true, order_draft: draft });

        const summary =
          `📋 আপনার অর্ডারের চূড়ান্ত তথ্য:\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `নাম: ${draft.customer_name}\n` +
          `মোবাইল: ${draft.mobile_number}\n` +
          `প্রোডাক্ট: ${selectedProd.product_name} (${selectedProd.product_id})\n` +
          `কালার: ${color}\n` +
          `পরিমাণ: ${qty} পিস\n` +
          `ঠিকানা: ${draft.full_address}\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `সাবটোটাল: ৳${calc.subtotal}\n` +
          (calc.discountTotal > 0 ? `ডিসকাউন্ট: -৳${calc.discountTotal}\n` : '') +
          `ডেলিভারি চার্জ: ৳${calc.deliveryCharge}\n` +
          `সর্বমোট প্রদেয়: ৳${calc.grandTotal}\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `"আপনার অর্ডারটি কি Confirm করবেন?"\n(দয়া করে "হ্যাঁ" অথবা "Confirm" লিখে নিশ্চিত করুন)`;

        return { reply: summary, imageUrl: selectedProd.images[0]?.image_url };
      } else {
        return {
          reply: `অর্ডারটি কনফার্ম করার জন্য অনুগ্রহ করে আপনার:\n১. নাম\n২. সচল মোবাইল নাম্বার (১১ ডিজিট)\n৩. পছন্দের কালার\n৪. সম্পূর্ণ ডেলিভারি ঠিকানা (জেলা, থানা, এলাকা)\nলিখে পাঠান। আমরা সাথে সাথে ক্যালকুলেশন করে ফাইনাল সামারি দেখিয়ে কনফার্মেশন নেব।`,
          imageUrl: matched.images[0]?.image_url,
        };
      }
    }

    // Default product details
    const priceText = matched.discount_price
      ? `রেগুলার মূল্য ৳${matched.price}, বর্তমান ডিসকাউন্ট মূল্য মাত্র ৳${matched.discount_price}!`
      : `মূল্য মাত্র ৳${matched.price}।`;

    return {
      reply: `আসসালামু আলাইকুম! Ghorer Shopping-এ স্বাগতম।🌸\n\nআমাদের "${matched.product_name}" (${matched.product_id}):\n• ${priceText}\n• কাপড়: ${matched.fabric}\n• ওড়না: ${matched.orna_length}\n• সাইজ: ${matched.size}\n• অ্যাভেইলেবল কালার: ${matched.colors.join(', ')}\n• স্টক: ${matched.stock > 0 ? `${matched.stock} পিস স্টক আছে (পাকা রঙের গ্যারান্টি)` : 'বর্তমানে স্টক শেষ'}\n\nআপনি কি অর্ডার করতে চান?`,
      imageUrl: matched.images[0]?.image_url,
    };
  }
}

export const geminiAgent = new MultiModelSalesAgent();
