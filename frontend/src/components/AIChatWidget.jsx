import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Bot, User, Check, BarChart3, TrendingUp, PieChart } from 'lucide-react';
import { drugAPI, orderAPI, inventoryAPI } from '../utils/api';
import toast from 'react-hot-toast';
import { BarChart, Bar, LineChart, Line, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const AIChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content: 'Xin chào! Tôi là AI Supply Chain Assistant. Tôi có thể giúp bạn phân tích dữ liệu về thuốc, đơn hàng và kho hàng. Tôi cũng có thể tạo biểu đồ trực quan và đơn hàng dự thảo. Hãy hỏi tôi bất cứ điều gì!',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto scroll to bottom when new message is added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Fetch data from APIs
  const fetchData = async () => {
    try {
      // Fetch stats first for accurate totals, then fetch sample data for analysis
      // Backend has limit of 100, so we use stats API for totals
      const [drugStatsResponse, drugsResponse, ordersResponse, inventoryResponse] = await Promise.allSettled([
        drugAPI.getDrugStats().catch(() => ({ data: { data: {} } })),
        drugAPI.getDrugs({ limit: 100 }).catch(() => ({ data: { data: { drugs: [] } } })),
        orderAPI.getOrders({ limit: 100 }).catch(() => ({ data: { data: { orders: [] } } })),
        inventoryAPI.getInventory({ limit: 100 }).catch(() => ({ data: { data: { inventory: [] } } }))
      ]);

      const drugs = drugsResponse.status === 'fulfilled' 
        ? drugsResponse.value?.data?.drugs || drugsResponse.value?.data?.data?.drugs || []
        : [];
      
      const orders = ordersResponse.status === 'fulfilled'
        ? ordersResponse.value?.data?.orders || ordersResponse.value?.data?.data?.orders || []
        : [];

      const inventory = inventoryResponse.status === 'fulfilled'
        ? inventoryResponse.value?.data?.inventory || inventoryResponse.value?.data?.data?.inventory || []
        : [];

      // Get stats for accurate totals
      // API returns: { success: true, data: { total, active, recalled, expired, expiringSoon, ... } }
      const drugStatsData = drugStatsResponse.status === 'fulfilled'
        ? drugStatsResponse.value?.data?.data || drugStatsResponse.value?.data || {}
        : {};

      // Transform data to a cleaner format for AI
      // Use stats API for accurate totals, sample data for detailed analysis
      const dataForAI = {
        // Include stats for accurate totals (from API, not array length)
        // API returns: { total, active, recalled, expired, expiringSoon }
        stats: {
          totalDrugs: drugStatsData.total || 0,
          activeDrugs: drugStatsData.active || 0,
          recalledDrugs: drugStatsData.recalled || 0,
          expiredDrugs: drugStatsData.expired || 0,
          expiringSoon: drugStatsData.expiringSoon || 0,
          totalOrders: orders.length, // Sample data only
          totalInventory: inventory.length // Sample data only
        },
        drugs: drugs.map(drug => ({
          id: drug._id || drug.id,
          name: drug.name,
          batchNumber: drug.batchNumber,
          quantity: drug.quantity || drug.stock || 0,
          expiryDate: drug.expiryDate,
          price: drug.price,
          status: drug.status,
          manufacturer: drug.manufacturerId?.fullName || drug.manufacturerName,
          distributionStatus: drug.distribution?.status
        })),
        orders: orders.map(order => ({
          id: order._id || order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          totalAmount: order.totalAmount || order.total,
          items: order.items?.map(item => ({
            drugName: item.drugName || item.drug?.name,
            quantity: item.quantity,
            price: item.price
          })) || [],
          createdAt: order.createdAt,
          buyer: order.buyer?.fullName || order.buyerName,
          seller: order.seller?.fullName || order.sellerName
        })),
        inventory: inventory.map(item => ({
          id: item._id || item.id,
          drugId: item.drugId || item.drug?._id || item.drug?.id,
          drugName: item.drugName || item.drug?.name,
          location: item.location,
          quantity: item.quantity || item.stock,
          unit: item.unit,
          lastUpdated: item.updatedAt || item.lastUpdated
        }))
      };

      return dataForAI;
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Không thể tải dữ liệu. Vui lòng thử lại.');
      return { drugs: [], orders: [], inventory: [] };
    }
  };

  // Send message to OpenAI
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    
    // Add user message
    const newUserMessage = {
      id: Date.now(),
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);
    setIsTyping(true);

    try {
      // Fetch data
      const dataForAI = await fetchData();

      // Prepare prompt for OpenAI
      const systemPrompt = `You are an intelligent Supply Chain Assistant for a drug traceability system. Analyze the provided JSON data to answer the user's question concisely and accurately.

Available data:
- Stats: Total counts (totalDrugs, activeDrugs, totalOrders, totalInventory) - ALWAYS use these stats for accurate totals, NOT array lengths
- Drugs: List of drugs with name, batchNumber, quantity, expiryDate, price, status, manufacturer, distributionStatus
- Orders: List of orders with orderNumber, status, totalAmount, items, createdAt, buyer, seller
- Inventory: List of inventory items with drugName, location, quantity, unit, lastUpdated

IMPORTANT RULES:
1. When asked about totals or counts (like "how many drugs"), ALWAYS use data.stats.totalDrugs instead of data.drugs.length for accurate numbers.
2. If the user asks for data trends, comparisons, visualizations, or charts (e.g., "show me a chart", "compare", "trend", "visualize"), ALWAYS use the plot_chart tool.
3. If the user wants to buy, restock, or create an order (e.g., "I want to buy", "create order", "restock", "order"), ALWAYS use the create_draft_order tool.
4. Answer in Vietnamese. Be concise and data-driven. If the data is not available, say so clearly.`;

      const userPrompt = `User question: ${userMessage}

Data:
${JSON.stringify(dataForAI, null, 2)}`;

      // Define tools/functions for OpenAI
      const tools = [
        {
          type: 'function',
          function: {
            name: 'plot_chart',
            description: 'Create a chart to visualize data trends, comparisons, or distributions. Use this when user asks for charts, graphs, visualizations, comparisons, or trends.',
            parameters: {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                  enum: ['bar', 'line', 'pie'],
                  description: 'Type of chart: bar for comparisons, line for trends, pie for distributions'
                },
                data: {
                  type: 'array',
                  items: { type: 'object' },
                  description: 'Array of data objects to plot'
                },
                title: {
                  type: 'string',
                  description: 'Chart title'
                },
                dataKey: {
                  type: 'string',
                  description: 'Key in data objects for the Y-axis value (e.g., "value", "quantity", "amount")'
                },
                xAxisKey: {
                  type: 'string',
                  description: 'Key in data objects for the X-axis label (e.g., "name", "date", "category")'
                }
              },
              required: ['type', 'data', 'title', 'dataKey', 'xAxisKey']
            }
          }
        },
        {
          type: 'function',
          function: {
            name: 'create_draft_order',
            description: 'Create a draft order for purchasing or restocking drugs. Use this when user wants to buy, order, or restock drugs.',
            parameters: {
              type: 'object',
              properties: {
                drugName: {
                  type: 'string',
                  description: 'Name of the drug to order'
                },
                quantity: {
                  type: 'number',
                  description: 'Quantity to order'
                }
              },
              required: ['drugName', 'quantity']
            }
          }
        }
      ];

      // Call OpenAI API with tools
      // Note: In production, you should call this through your backend to keep API key secure
      const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY || 'your-api-key-here';
      const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini', // Use gpt-4o-mini or gpt-4-turbo for better function calling
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          tools: tools,
          tool_choice: 'auto', // Let AI decide when to use tools
          temperature: 0.7,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('OpenAI API error:', errorData);
        throw new Error(`OpenAI API error: ${response.statusText} - ${errorData.error?.message || ''}`);
      }

      const data = await response.json();
      const message = data.choices[0]?.message;
      
      // Check if AI wants to call a tool
      if (message.tool_calls && message.tool_calls.length > 0) {
        // Handle tool calls
        const toolCalls = message.tool_calls;
        const toolResults = [];
        
        for (const toolCall of toolCalls) {
          const functionName = toolCall.function.name;
          const functionArgs = JSON.parse(toolCall.function.arguments);
          
          if (functionName === 'plot_chart') {
            // Store chart data in message for rendering
            toolResults.push({
              type: 'chart',
              chartType: functionArgs.type,
              chartData: functionArgs.data,
              chartTitle: functionArgs.title,
              dataKey: functionArgs.dataKey,
              xAxisKey: functionArgs.xAxisKey
            });
          } else if (functionName === 'create_draft_order') {
            // Mock API call
            const draftOrder = {
              drugName: functionArgs.drugName,
              quantity: functionArgs.quantity,
              status: 'draft',
              createdAt: new Date()
            };
            
            toolResults.push({
              type: 'draft_order',
              order: draftOrder
            });
          }
        }
        
        // Add AI message with tool calls
        const newAiMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          content: message.content || '', // May be empty if only tool calls
          toolCalls: toolResults,
          timestamp: new Date()
        };
        
        setIsTyping(false);
        setMessages(prev => [...prev, newAiMessage]);
      } else {
        // Regular text response
        const aiResponse = message.content || 'Xin lỗi, tôi không thể trả lời câu hỏi này.';

        // Add AI response
        const newAiMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          content: aiResponse,
          timestamp: new Date()
        };
        
        setIsTyping(false);
        setMessages(prev => [...prev, newAiMessage]);
      }
    } catch (error) {
      console.error('Error calling OpenAI:', error);
      setIsTyping(false);
      
      // Fetch data for fallback analysis
      const dataForAI = await fetchData();
      
      // Check if this is a chart or order request that we can handle in fallback
      const lowerMessage = userMessage.toLowerCase();
      const isChartRequest = lowerMessage.includes('biểu đồ') || lowerMessage.includes('chart') || 
                            lowerMessage.includes('vẽ') || (lowerMessage.includes('so sánh') && lowerMessage.includes('số lượng')) ||
                            lowerMessage.includes('visualize') || lowerMessage.includes('graph');
      const isOrderRequest = lowerMessage.includes('mua') || lowerMessage.includes('buy') || 
                            lowerMessage.includes('đặt hàng') || lowerMessage.includes('order') ||
                            lowerMessage.includes('restock') || lowerMessage.includes('tái cung ứng');
      
      // If it's a chart request, try to create a chart
      if (isChartRequest && dataForAI.drugs && dataForAI.drugs.length > 0) {
        const chartData = dataForAI.drugs.slice(0, 10).map(drug => ({
          name: drug.name || 'Unknown',
          quantity: drug.quantity || 0,
          value: drug.quantity || 0
        }));
        
        const chartMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          content: 'Đã tạo biểu đồ so sánh số lượng thuốc (chế độ fallback):',
          toolCalls: [{
            type: 'chart',
            chartType: 'bar',
            chartData: chartData,
            chartTitle: 'So sánh số lượng thuốc',
            dataKey: 'quantity',
            xAxisKey: 'name'
          }],
          timestamp: new Date()
        };
        setMessages(prev => [...prev, chartMessage]);
      } 
      // If it's an order request, try to create a draft order
      else if (isOrderRequest) {
        const quantityMatch = userMessage.match(/(\d+)/);
        const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 0;
        
        // Try to extract drug name - look for common drug names or extract from context
        const drugKeywords = ['paracetamol', 'amoxicillin', 'ibuprofen', 'aspirin', 'penicillin'];
        let foundDrug = drugKeywords.find(drug => lowerMessage.includes(drug.toLowerCase()));
        
        // If not found in keywords, try to extract from the message
        if (!foundDrug) {
          // Look for capitalized words that might be drug names
          const words = userMessage.split(' ');
          foundDrug = words.find(word => word.length > 4 && word[0] === word[0].toUpperCase()) || 'Unknown';
        }
        
        if (quantity > 0) {
          const orderMessage = {
            id: Date.now() + 1,
            role: 'assistant',
            content: 'Đã tạo đơn hàng dự thảo (chế độ fallback):',
            toolCalls: [{
              type: 'draft_order',
              order: {
                drugName: foundDrug,
                quantity: quantity,
                status: 'draft',
                createdAt: new Date()
              }
            }],
            timestamp: new Date()
          };
          setMessages(prev => [...prev, orderMessage]);
        } else {
          const errorMessage = {
            id: Date.now() + 1,
            role: 'assistant',
            content: 'Vui lòng cung cấp tên thuốc và số lượng cụ thể để tạo đơn hàng. Ví dụ: "Tôi muốn mua Paracetamol với số lượng 100"',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, errorMessage]);
        }
      } 
      // Otherwise, use simple text fallback
      else {
        const fallbackResponse = analyzeDataLocally(userMessage, dataForAI);
        
        const errorMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          content: fallbackResponse || 'Xin lỗi, có lỗi xảy ra khi xử lý câu hỏi của bạn. Vui lòng thử lại sau.',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
      
      // Only show error toast once per session, and only for API key issues
      const errorKey = error.message?.includes('API key') || error.message?.includes('401') 
        ? 'api_key_error' 
        : 'connection_error';
      const hasShownError = sessionStorage.getItem(`ai_chatbot_${errorKey}`);
      
      if (!hasShownError) {
        if (error.message?.includes('API key') || error.message?.includes('401')) {
          toast.error('Vui lòng cấu hình OpenAI API key trong file .env', { 
            duration: 5000,
            id: 'ai-api-key-error' // Use id to prevent duplicates
          });
          sessionStorage.setItem('ai_chatbot_api_key_error', 'true');
        }
        // Don't show toast for connection errors - fallback is working silently
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Simple local analysis as fallback
  const analyzeDataLocally = (question, data) => {
    const lowerQuestion = question.toLowerCase();
    
    // Check for chart requests FIRST (before other checks)
    if (lowerQuestion.includes('biểu đồ') || lowerQuestion.includes('chart') || 
        lowerQuestion.includes('vẽ') || lowerQuestion.includes('so sánh') ||
        lowerQuestion.includes('visualize') || lowerQuestion.includes('graph') ||
        (lowerQuestion.includes('số lượng') && (lowerQuestion.includes('biểu đồ') || lowerQuestion.includes('chart') || lowerQuestion.includes('vẽ')))) {
      // Try to create a simple chart from available data
      if (data.drugs && data.drugs.length > 0) {
        // Create chart data from drugs
        const chartData = data.drugs.slice(0, 10).map(drug => ({
          name: drug.name || 'Unknown',
          quantity: drug.quantity || 0,
          value: drug.quantity || 0
        }));
        
        // Return a message indicating chart should be shown
        // Note: In a real fallback, we'd need to trigger chart rendering
        return `Tôi đã tạo biểu đồ so sánh số lượng của ${chartData.length} loại thuốc đầu tiên.`;
      }
      return 'Không có dữ liệu để tạo biểu đồ.';
    }
    
    // Check for order requests
    if (lowerQuestion.includes('mua') || lowerQuestion.includes('buy') || 
        lowerQuestion.includes('đặt hàng') || lowerQuestion.includes('order') ||
        lowerQuestion.includes('restock') || lowerQuestion.includes('tái cung ứng')) {
      // Extract drug name and quantity from question
      const quantityMatch = question.match(/(\d+)/);
      const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 0;
      
      // Try to extract drug name (simplified)
      const drugKeywords = ['paracetamol', 'amoxicillin', 'ibuprofen', 'aspirin'];
      const foundDrug = drugKeywords.find(drug => lowerQuestion.includes(drug.toLowerCase()));
      
      if (foundDrug && quantity > 0) {
        return `Đã tạo đơn hàng dự thảo cho ${foundDrug} với số lượng ${quantity}. Vui lòng xác nhận đơn hàng.`;
      }
      return 'Vui lòng cung cấp tên thuốc và số lượng cụ thể để tạo đơn hàng.';
    }
    
    // Check for low stock (only if not asking for chart)
    if (lowerQuestion.includes('thấp') || lowerQuestion.includes('hết') || lowerQuestion.includes('ít') || 
        (lowerQuestion.includes('số lượng') && !lowerQuestion.includes('biểu đồ') && !lowerQuestion.includes('chart') && !lowerQuestion.includes('vẽ'))) {
      const lowStockDrugs = data.drugs.filter(d => {
        const qty = d.quantity || d.stock || 0;
        return qty < 50 && qty > 0;
      });
      
      if (lowStockDrugs.length > 0) {
        const drugList = lowStockDrugs.slice(0, 10).map(d => 
          `- ${d.name}${d.batchNumber ? ` (${d.batchNumber})` : ''}: ${d.quantity || d.stock || 0} đơn vị`
        ).join('\n');
        const moreText = lowStockDrugs.length > 10 ? `\n... và ${lowStockDrugs.length - 10} loại thuốc khác.` : '';
        return `Có ${lowStockDrugs.length} loại thuốc đang có số lượng thấp (dưới 50 đơn vị):\n\n${drugList}${moreText}`;
      }
      
      // Check inventory for low stock
      const lowStockInventory = data.inventory.filter(item => {
        const qty = item.quantity || item.stock || 0;
        return qty < 50 && qty > 0;
      });
      
      if (lowStockInventory.length > 0) {
        const inventoryList = lowStockInventory.slice(0, 10).map(item => 
          `- ${item.drugName || 'N/A'}: ${item.quantity || item.stock || 0} ${item.unit || 'đơn vị'}${item.location ? ` tại ${item.location}` : ''}`
        ).join('\n');
        return `Có ${lowStockInventory.length} mục trong kho đang có số lượng thấp:\n\n${inventoryList}`;
      }
      
      return 'Hiện tại không có thuốc nào có số lượng thấp. Tất cả các thuốc đều có số lượng đủ.';
    }

    // Check for revenue
    if (lowerQuestion.includes('doanh thu') || lowerQuestion.includes('revenue') || lowerQuestion.includes('tháng trước')) {
      const completedOrders = data.orders.filter(o => 
        o.status === 'completed' || o.status === 'delivered' || o.status === 'paid'
      );
      const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.totalAmount || o.total || 0), 0);
      
      // Calculate last month revenue
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      const lastMonthOrders = completedOrders.filter(o => {
        const orderDate = new Date(o.createdAt || o.date);
        return orderDate >= lastMonth;
      });
      const lastMonthRevenue = lastMonthOrders.reduce((sum, o) => sum + (o.totalAmount || o.total || 0), 0);
      
      if (lowerQuestion.includes('tháng trước') || lowerQuestion.includes('last month')) {
        return `Doanh thu tháng trước: ${lastMonthRevenue.toLocaleString('vi-VN')} VNĐ\n(Số đơn hàng: ${lastMonthOrders.length})`;
      }
      
      return `Tổng doanh thu từ các đơn hàng đã hoàn thành: ${totalRevenue.toLocaleString('vi-VN')} VNĐ\n(Số đơn hàng: ${completedOrders.length})`;
    }

    // Check for total drugs
    if (lowerQuestion.includes('tổng') || lowerQuestion.includes('bao nhiêu') || lowerQuestion.includes('số lượng') || lowerQuestion.includes('loại thuốc')) {
      // Always use stats for accurate totals (from API, not sample data)
      const totalDrugs = data.stats?.totalDrugs || 0;
      const activeDrugs = data.stats?.activeDrugs || 0;
      const recalledDrugs = data.stats?.recalledDrugs || 0;
      const expiredDrugs = data.stats?.expiredDrugs || 0;
      const totalOrders = data.orders.length; // Sample data only
      const totalInventory = data.inventory.length; // Sample data only
      
      const expiringSoon = data.stats?.expiringSoon || 0;
      
      if (totalDrugs > 0) {
        return `📊 Thống kê tổng quan:\n\n` +
               `• Tổng số lô thuốc: ${totalDrugs}\n` +
               `• Đang hoạt động: ${activeDrugs}\n` +
               `• Đã thu hồi: ${recalledDrugs}\n` +
               `• Hết hạn: ${expiredDrugs}\n` +
               (expiringSoon > 0 ? `• Sắp hết hạn: ${expiringSoon}\n` : '') +
               `• Tổng số đơn hàng (mẫu): ${totalOrders}\n` +
               `• Tổng số mục trong kho (mẫu): ${totalInventory}`;
      } else {
        // Fallback if stats not available
        return `📊 Thống kê tổng quan:\n\n` +
               `• Tổng số lô thuốc (mẫu): ${data.drugs.length}\n` +
               `• Tổng số đơn hàng (mẫu): ${totalOrders}\n` +
               `• Tổng số mục trong kho (mẫu): ${totalInventory}\n\n` +
               `⚠️ Lưu ý: Đây là dữ liệu mẫu (giới hạn 100). Để có số liệu chính xác, vui lòng kiểm tra trang thống kê.`;
      }
    }

    // Check for pending orders
    if (lowerQuestion.includes('chờ') || lowerQuestion.includes('pending') || lowerQuestion.includes('đang xử lý')) {
      const pendingOrders = data.orders.filter(o => 
        o.status === 'pending' || o.status === 'processing' || o.status === 'confirmed'
      );
      if (pendingOrders.length > 0) {
        const orderList = pendingOrders.slice(0, 5).map(o => 
          `- ${o.orderNumber || o.id}: ${o.totalAmount?.toLocaleString('vi-VN') || 0} VNĐ (${o.status})`
        ).join('\n');
        return `Có ${pendingOrders.length} đơn hàng đang chờ xử lý:\n\n${orderList}`;
      }
      return 'Hiện tại không có đơn hàng nào đang chờ xử lý.';
    }

    // Default response
    return 'Tôi có thể giúp bạn phân tích dữ liệu về:\n\n' +
           '• Số lượng thuốc thấp\n' +
           '• Doanh thu và đơn hàng\n' +
           '• Thống kê tổng quan\n' +
           '• Đơn hàng đang chờ xử lý\n\n' +
           'Hãy hỏi cụ thể hơn!';
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all duration-300 ${
          isOpen
            ? 'bg-red-500 hover:bg-red-600'
            : 'bg-blue-600 hover:bg-blue-700'
        } text-white`}
        aria-label="Toggle AI Chat"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6" />
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 h-[600px] bg-white rounded-lg shadow-2xl flex flex-col border border-gray-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bot className="w-5 h-5" />
              <h3 className="font-semibold">AI Supply Chain Assistant</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-blue-800 rounded-full p-1 transition-colors"
              aria-label="Close chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start space-x-2 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-blue-600" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-800 border border-gray-200'
                  }`}
                >
                  {/* Text content */}
                  {message.content && (
                    <p className="text-sm whitespace-pre-wrap mb-2">{message.content}</p>
                  )}
                  
                  {/* Render tool calls */}
                  {message.toolCalls && message.toolCalls.map((toolCall, index) => {
                    if (toolCall.type === 'chart') {
                      return (
                        <div key={index} className="my-2">
                          <h4 className="text-sm font-semibold mb-2">{toolCall.chartTitle}</h4>
                          <div className="w-full h-64">
                            {toolCall.chartType === 'bar' && (
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={toolCall.chartData}>
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey={toolCall.xAxisKey} />
                                  <YAxis />
                                  <Tooltip />
                                  <Legend />
                                  <Bar dataKey={toolCall.dataKey} fill="#3b82f6" />
                                </BarChart>
                              </ResponsiveContainer>
                            )}
                            {toolCall.chartType === 'line' && (
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={toolCall.chartData}>
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey={toolCall.xAxisKey} />
                                  <YAxis />
                                  <Tooltip />
                                  <Legend />
                                  <Line type="monotone" dataKey={toolCall.dataKey} stroke="#3b82f6" strokeWidth={2} />
                                </LineChart>
                              </ResponsiveContainer>
                            )}
                            {toolCall.chartType === 'pie' && (
                              <ResponsiveContainer width="100%" height="100%">
                                <RechartsPieChart>
                                  <Pie
                                    data={toolCall.chartData}
                                    dataKey={toolCall.dataKey}
                                    nameKey={toolCall.xAxisKey}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    label
                                  >
                                    {toolCall.chartData.map((entry, idx) => (
                                      <Cell key={`cell-${idx}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][idx % 5]} />
                                    ))}
                                  </Pie>
                                  <Tooltip />
                                  <Legend />
                                </RechartsPieChart>
                              </ResponsiveContainer>
                            )}
                          </div>
                        </div>
                      );
                    } else if (toolCall.type === 'draft_order') {
                      return (
                        <div key={index} className="my-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center space-x-2 mb-2">
                            <Check className="w-5 h-5 text-green-600" />
                            <h4 className="text-sm font-semibold text-green-800">Draft Order Created</h4>
                          </div>
                          <div className="text-sm text-gray-700 space-y-1">
                            <p><strong>Drug:</strong> {toolCall.order.drugName}</p>
                            <p><strong>Quantity:</strong> {toolCall.order.quantity}</p>
                            <p><strong>Status:</strong> Draft</p>
                          </div>
                          <button
                            onClick={() => {
                              // Mock confirm order
                              toast.success(`Đơn hàng cho ${toolCall.order.drugName} đã được xác nhận!`);
                            }}
                            className="mt-3 w-full bg-green-600 hover:bg-green-700 text-white text-sm py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                          >
                            <Check className="w-4 h-4" />
                            <span>Confirm Order</span>
                          </button>
                        </div>
                      );
                    }
                    return null;
                  })}
                  
                  <span className="text-xs opacity-70 mt-1 block">
                    {message.timestamp.toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                {message.role === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                )}
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-start space-x-2">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-blue-600" />
                </div>
                <div className="bg-white rounded-lg px-4 py-2 border border-gray-200">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200 bg-white rounded-b-lg">
            <div className="flex items-end space-x-2">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Hỏi về dữ liệu thuốc, đơn hàng, kho hàng..."
                className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={2}
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                  !inputValue.trim() || isLoading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
                aria-label="Send message"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Nhấn Enter để gửi, Shift+Enter để xuống dòng
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default AIChatWidget;

