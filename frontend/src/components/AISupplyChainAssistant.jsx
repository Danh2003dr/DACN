import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Bot, User, Check, BarChart3, TrendingUp, PieChart, AlertTriangle, MapPin, Clock, Package, Truck, Activity, Zap } from 'lucide-react';
import { supplyChainAPI, drugAPI, orderAPI, inventoryAPI } from '../utils/api';
import toast from 'react-hot-toast';
import { BarChart, Bar, LineChart, Line, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const AISupplyChainAssistant = ({ supplyChains = [], onRefresh }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content: 'Xin chào! Tôi là AI Supply Chain Assistant chuyên biệt. Tôi có thể giúp bạn:\n\n• Phân tích hành trình chuỗi cung ứng\n• Dự đoán rủi ro và cảnh báo\n• Gợi ý tối ưu hóa quy trình\n• Phân tích xu hướng và hiệu quả\n• Tạo báo cáo thông minh\n• Phân tích hiệu suất các bước trong chuỗi\n\n💡 Gợi ý câu hỏi:\n- "Phân tích rủi ro trong chuỗi cung ứng"\n- "Hiệu quả của các chuỗi cung ứng"\n- "Xu hướng và thống kê"\n- "Vẽ biểu đồ phân bố trạng thái"\n\nHãy hỏi tôi bất cứ điều gì về chuỗi cung ứng!',
      timestamp: new Date()
    }
  ]);
  const [quickActions] = useState([
    { label: 'Phân tích rủi ro', query: 'Phân tích rủi ro trong chuỗi cung ứng' },
    { label: 'Hiệu quả', query: 'Phân tích hiệu quả của các chuỗi cung ứng' },
    { label: 'Thống kê', query: 'Thống kê và xu hướng chuỗi cung ứng' },
    { label: 'Biểu đồ', query: 'Vẽ biểu đồ phân bố trạng thái' }
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

  // Fetch comprehensive supply chain data
  const fetchSupplyChainData = async () => {
    try {
      // Fetch all relevant data
      const [supplyChainsResponse, drugsResponse, ordersResponse, inventoryResponse] = await Promise.allSettled([
        supplyChainAPI.getSupplyChains('limit=100').catch(() => ({ data: { data: { supplyChains: [] } } })),
        drugAPI.getDrugs({ limit: 100 }).catch(() => ({ data: { data: { drugs: [] } } })),
        orderAPI.getOrders({ limit: 100 }).catch(() => ({ data: { data: { orders: [] } } })),
        inventoryAPI.getInventory({ limit: 100 }).catch(() => ({ data: { data: { inventory: [] } } }))
      ]);

      const supplyChainsData = supplyChainsResponse.status === 'fulfilled'
        ? supplyChainsResponse.value?.data?.supplyChains || supplyChainsResponse.value?.data?.data?.supplyChains || []
        : [];

      const drugs = drugsResponse.status === 'fulfilled'
        ? drugsResponse.value?.data?.drugs || drugsResponse.value?.data?.data?.drugs || []
        : [];

      const orders = ordersResponse.status === 'fulfilled'
        ? ordersResponse.value?.data?.orders || ordersResponse.value?.data?.data?.orders || []
        : [];

      const inventory = inventoryResponse.status === 'fulfilled'
        ? inventoryResponse.value?.data?.inventory || inventoryResponse.value?.data?.data?.inventory || []
        : [];

      // Transform supply chain data for AI analysis
      const transformedSupplyChains = supplyChainsData.map(sc => ({
        id: sc._id || sc.id,
        drugBatchNumber: sc.drugBatchNumber,
        drugName: sc.drugId?.name || 'N/A',
        status: sc.status,
        currentLocation: sc.currentLocation,
        steps: (sc.steps || []).map(step => ({
          action: step.action,
          actorName: step.actorName,
          actorRole: step.actorRole,
          timestamp: step.timestamp,
          location: step.location,
          metadata: step.metadata,
          temperature: step.metadata?.temperature,
          hasWarning: step.metadata?.hasWarning || step.metadata?.warning
        })),
        createdAt: sc.createdAt,
        blockchain: sc.blockchain,
        qualityChecks: sc.qualityChecks || []
      }));

      return {
        supplyChains: transformedSupplyChains,
        stats: {
          totalSupplyChains: transformedSupplyChains.length,
          active: transformedSupplyChains.filter(sc => sc.status === 'active').length,
          recalled: transformedSupplyChains.filter(sc => sc.status === 'recalled').length,
          completed: transformedSupplyChains.filter(sc => sc.status === 'completed').length,
          totalSteps: transformedSupplyChains.reduce((sum, sc) => sum + (sc.steps?.length || 0), 0),
          avgStepsPerChain: transformedSupplyChains.length > 0 
            ? (transformedSupplyChains.reduce((sum, sc) => sum + (sc.steps?.length || 0), 0) / transformedSupplyChains.length).toFixed(2)
            : 0
        },
        drugs: drugs.map(drug => ({
          id: drug._id || drug.id,
          name: drug.name,
          batchNumber: drug.batchNumber,
          quantity: drug.quantity || drug.stock || 0,
          expiryDate: drug.expiryDate,
          status: drug.status
        })),
        orders: orders.map(order => ({
          id: order._id || order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          totalAmount: order.totalAmount || order.total,
          createdAt: order.createdAt
        })),
        inventory: inventory.map(item => ({
          id: item._id || item.id,
          drugName: item.drugName || item.drug?.name,
          location: item.location,
          quantity: item.quantity || item.stock,
          unit: item.unit
        }))
      };
    } catch (error) {
      console.error('Error fetching supply chain data:', error);
      toast.error('Không thể tải dữ liệu chuỗi cung ứng. Vui lòng thử lại.');
      return {
        supplyChains: [],
        stats: {},
        drugs: [],
        orders: [],
        inventory: []
      };
    }
  };

  // Analyze supply chain locally
  const analyzeSupplyChainLocally = (question, data) => {
    const lowerQuestion = question.toLowerCase();
    
    // Risk analysis
    if (lowerQuestion.includes('rủi ro') || lowerQuestion.includes('risk') || lowerQuestion.includes('cảnh báo') || lowerQuestion.includes('warning')) {
      const risks = [];
      
      // Check for temperature warnings
      const tempWarnings = data.supplyChains.filter(sc => 
        sc.steps?.some(step => step.temperature && step.temperature > 25)
      );
      if (tempWarnings.length > 0) {
        risks.push({
          type: 'temperature',
          count: tempWarnings.length,
          message: `${tempWarnings.length} chuỗi cung ứng có cảnh báo nhiệt độ vượt quá 25°C`
        });
      }
      
      // Check for recalled chains
      if (data.stats.recalled > 0) {
        risks.push({
          type: 'recalled',
          count: data.stats.recalled,
          message: `${data.stats.recalled} chuỗi cung ứng đã bị thu hồi`
        });
      }
      
      // Check for chains with many steps (potential delays)
      const longChains = data.supplyChains.filter(sc => (sc.steps?.length || 0) > 10);
      if (longChains.length > 0) {
        risks.push({
          type: 'delay',
          count: longChains.length,
          message: `${longChains.length} chuỗi cung ứng có nhiều bước (có thể bị trễ)`
        });
      }
      
      if (risks.length > 0) {
        return `⚠️ Phân tích rủi ro:\n\n${risks.map(r => `• ${r.message}`).join('\n')}\n\nTổng cộng: ${risks.length} loại rủi ro được phát hiện.`;
      }
      return '✅ Không phát hiện rủi ro đáng kể trong chuỗi cung ứng hiện tại.';
    }
    
    // Efficiency analysis
    if (lowerQuestion.includes('hiệu quả') || lowerQuestion.includes('efficiency') || lowerQuestion.includes('tối ưu') || lowerQuestion.includes('optimize')) {
      const avgSteps = parseFloat(data.stats.avgStepsPerChain) || 0;
      const completedChains = data.supplyChains.filter(sc => sc.status === 'completed');
      const completionRate = data.supplyChains.length > 0 
        ? ((completedChains.length / data.supplyChains.length) * 100).toFixed(1)
        : 0;
      
      let suggestions = [];
      
      if (avgSteps > 8) {
        suggestions.push('Giảm số bước trung bình trong chuỗi cung ứng (hiện tại: ' + avgSteps + ' bước)');
      }
      
      if (parseFloat(completionRate) < 70) {
        suggestions.push('Cải thiện tỷ lệ hoàn thành (hiện tại: ' + completionRate + '%)');
      }
      
      const chainsWithoutBlockchain = data.supplyChains.filter(sc => !sc.blockchain?.isOnBlockchain);
      if (chainsWithoutBlockchain.length > 0) {
        suggestions.push(`${chainsWithoutBlockchain.length} chuỗi cung ứng chưa được ghi lên blockchain`);
      }
      
      return `📊 Phân tích hiệu quả:\n\n` +
             `• Số bước trung bình: ${avgSteps}\n` +
             `• Tỷ lệ hoàn thành: ${completionRate}%\n` +
             `• Tổng số chuỗi: ${data.stats.totalSupplyChains}\n\n` +
             (suggestions.length > 0 
               ? `💡 Gợi ý tối ưu hóa:\n${suggestions.map(s => `• ${s}`).join('\n')}`
               : '✅ Chuỗi cung ứng đang hoạt động hiệu quả.');
    }
    
    // Trend analysis
    if (lowerQuestion.includes('xu hướng') || lowerQuestion.includes('trend') || lowerQuestion.includes('thống kê') || lowerQuestion.includes('statistics')) {
      const statusDistribution = {
        active: data.stats.active || 0,
        recalled: data.stats.recalled || 0,
        completed: data.stats.completed || 0,
        other: (data.stats.totalSupplyChains || 0) - (data.stats.active || 0) - (data.stats.recalled || 0) - (data.stats.completed || 0)
      };
      
      // Create chart data for visualization
      const chartData = [
        { name: 'Hoạt động', value: statusDistribution.active },
        { name: 'Hoàn thành', value: statusDistribution.completed },
        { name: 'Thu hồi', value: statusDistribution.recalled },
        { name: 'Khác', value: statusDistribution.other }
      ].filter(item => item.value > 0);
      
      return {
        text: `📈 Thống kê chuỗi cung ứng:\n\n` +
             `• Tổng số chuỗi: ${data.stats.totalSupplyChains || 0}\n` +
             `• Đang hoạt động: ${statusDistribution.active}\n` +
             `• Đã hoàn thành: ${statusDistribution.completed}\n` +
             `• Đã thu hồi: ${statusDistribution.recalled}\n` +
             `• Tổng số bước: ${data.stats.totalSteps || 0}\n` +
             `• Số bước trung bình: ${data.stats.avgStepsPerChain || 0}\n\n` +
             `💡 Đang tạo biểu đồ phân bố trạng thái...`,
        chart: {
          type: 'pie',
          data: chartData,
          title: 'Phân bố trạng thái chuỗi cung ứng',
          dataKey: 'value',
          xAxisKey: 'name'
        }
      };
    }
    
    // Location analysis
    if (lowerQuestion.includes('vị trí') || lowerQuestion.includes('location') || lowerQuestion.includes('địa điểm')) {
      const locations = {};
      data.supplyChains.forEach(sc => {
        const loc = sc.currentLocation?.address || sc.currentLocation?.actorName || 'Chưa xác định';
        locations[loc] = (locations[loc] || 0) + 1;
      });
      
      const topLocations = Object.entries(locations)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([loc, count]) => `• ${loc}: ${count} chuỗi`);
      
      return `📍 Phân tích vị trí:\n\n${topLocations.join('\n')}`;
    }
    
    // Step analysis
    if (lowerQuestion.includes('bước') || lowerQuestion.includes('step') || lowerQuestion.includes('hành trình')) {
      const stepCounts = {};
      data.supplyChains.forEach(sc => {
        sc.steps?.forEach(step => {
          stepCounts[step.action] = (stepCounts[step.action] || 0) + 1;
        });
      });
      
      const topSteps = Object.entries(stepCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([action, count]) => `• ${action}: ${count} lần`);
      
      return `🔄 Phân tích các bước:\n\n${topSteps.join('\n')}\n\nTổng số bước: ${data.stats.totalSteps}`;
    }
    
    // Default response
    return {
      text: 'Tôi có thể giúp bạn phân tích:\n\n' +
           '• Rủi ro và cảnh báo\n' +
           '• Hiệu quả và tối ưu hóa\n' +
           '• Xu hướng và thống kê\n' +
           '• Vị trí và địa điểm\n' +
           '• Các bước trong hành trình\n\n' +
           'Hãy hỏi cụ thể hơn!'
    };
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
      const dataForAI = await fetchSupplyChainData();

      // Prepare prompt for OpenAI
      const systemPrompt = `You are an intelligent Supply Chain Assistant specialized in drug traceability systems. Analyze the provided JSON data to answer the user's question concisely and accurately.

Available data:
- Supply Chains: List of supply chains with drugBatchNumber, drugName, status, currentLocation, steps (with action, actorName, actorRole, timestamp, location, metadata, temperature, hasWarning), blockchain info, qualityChecks
- Stats: Total counts, active, recalled, completed, totalSteps, avgStepsPerChain
- Drugs: List of drugs with name, batchNumber, quantity, expiryDate, status
- Orders: List of orders with orderNumber, status, totalAmount, createdAt
- Inventory: List of inventory items with drugName, location, quantity, unit

IMPORTANT RULES:
1. When asked about risks, warnings, or alerts, analyze temperature warnings (>25°C), recalled chains, delays, and blockchain issues.
2. When asked about efficiency or optimization, analyze average steps, completion rate, and blockchain coverage.
3. When asked for trends, statistics, or charts, ALWAYS use the plot_chart tool.
4. When asked about locations or geography, analyze currentLocation data.
5. When asked about steps or journey, analyze the steps array in supply chains.
6. Answer in Vietnamese. Be concise and data-driven. If the data is not available, say so clearly.`;

      const userPrompt = `User question: ${userMessage}

Data:
${JSON.stringify(dataForAI, null, 2)}`;

      // Define tools/functions for OpenAI
      const tools = [
        {
          type: 'function',
          function: {
            name: 'plot_chart',
            description: 'Create a chart to visualize supply chain data trends, comparisons, or distributions.',
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
                  description: 'Key in data objects for the Y-axis value'
                },
                xAxisKey: {
                  type: 'string',
                  description: 'Key in data objects for the X-axis label'
                }
              },
              required: ['type', 'data', 'title', 'dataKey', 'xAxisKey']
            }
          }
        },
        {
          type: 'function',
          function: {
            name: 'analyze_supply_chain',
            description: 'Analyze a specific supply chain by ID or batch number. Use this when user asks about a specific chain.',
            parameters: {
              type: 'object',
              properties: {
                supplyChainId: {
                  type: 'string',
                  description: 'ID or batch number of the supply chain to analyze'
                },
                analysisType: {
                  type: 'string',
                  enum: ['full', 'risks', 'efficiency', 'timeline'],
                  description: 'Type of analysis: full (all aspects), risks (only risks), efficiency (only efficiency), timeline (step-by-step)'
                }
              },
              required: ['supplyChainId']
            }
          }
        },
        {
          type: 'function',
          function: {
            name: 'predict_risks',
            description: 'Predict potential risks in supply chains based on patterns and data.',
            parameters: {
              type: 'object',
              properties: {
                riskType: {
                  type: 'string',
                  enum: ['temperature', 'delay', 'quality', 'blockchain', 'all'],
                  description: 'Type of risk to predict'
                }
              }
            }
          }
        },
        {
          type: 'function',
          function: {
            name: 'optimize_route',
            description: 'Suggest optimizations for supply chain routes and processes.',
            parameters: {
              type: 'object',
              properties: {
                optimizationType: {
                  type: 'string',
                  enum: ['steps', 'time', 'cost', 'quality', 'all'],
                  description: 'Type of optimization to suggest'
                }
              }
            }
          }
        }
      ];

      // Call OpenAI API with tools
      const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY || 'your-api-key-here';
      const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          tools: tools,
          tool_choice: 'auto',
          temperature: 0.7,
          max_tokens: 1500
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
            toolResults.push({
              type: 'chart',
              chartType: functionArgs.type,
              chartData: functionArgs.data,
              chartTitle: functionArgs.title,
              dataKey: functionArgs.dataKey,
              xAxisKey: functionArgs.xAxisKey
            });
          } else if (functionName === 'analyze_supply_chain') {
            // Find the supply chain
            const sc = dataForAI.supplyChains.find(s => 
              s.id === functionArgs.supplyChainId || 
              s.drugBatchNumber === functionArgs.supplyChainId
            );
            
            if (sc) {
              const analysis = analyzeSupplyChainLocally(
                functionArgs.analysisType === 'risks' ? 'rủi ro' :
                functionArgs.analysisType === 'efficiency' ? 'hiệu quả' :
                functionArgs.analysisType === 'timeline' ? 'bước' : 'tổng quan',
                { supplyChains: [sc], stats: {} }
              );
              
              toolResults.push({
                type: 'analysis',
                analysisType: functionArgs.analysisType,
                supplyChainId: functionArgs.supplyChainId,
                result: analysis,
                supplyChain: sc
              });
            } else {
              toolResults.push({
                type: 'error',
                message: `Không tìm thấy chuỗi cung ứng với ID: ${functionArgs.supplyChainId}`
              });
            }
          } else if (functionName === 'predict_risks') {
            const riskAnalysis = analyzeSupplyChainLocally('rủi ro', dataForAI);
            toolResults.push({
              type: 'risk_prediction',
              riskType: functionArgs.riskType,
              result: riskAnalysis
            });
          } else if (functionName === 'optimize_route') {
            const optimization = analyzeSupplyChainLocally('tối ưu', dataForAI);
            toolResults.push({
              type: 'optimization',
              optimizationType: functionArgs.optimizationType,
              result: optimization
            });
          }
        }
        
        // Add AI message with tool calls
        const newAiMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          content: message.content || '',
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
      
      // Fallback to local analysis
      const dataForAI = await fetchSupplyChainData();
      const fallbackResponse = analyzeSupplyChainLocally(userMessage, dataForAI);
      
      // Check if response includes chart data
      let messageContent = '';
      let toolCalls = [];
      
      if (typeof fallbackResponse === 'object' && fallbackResponse.chart) {
        messageContent = fallbackResponse.text || '';
        toolCalls = [{
          type: 'chart',
          chartType: fallbackResponse.chart.type,
          chartData: fallbackResponse.chart.data,
          chartTitle: fallbackResponse.chart.title,
          dataKey: fallbackResponse.chart.dataKey,
          xAxisKey: fallbackResponse.chart.xAxisKey
        }];
      } else if (typeof fallbackResponse === 'object' && fallbackResponse.text) {
        messageContent = fallbackResponse.text;
      } else {
        messageContent = typeof fallbackResponse === 'string' ? fallbackResponse : 'Xin lỗi, có lỗi xảy ra khi xử lý câu hỏi của bạn. Vui lòng thử lại sau.';
      }
      
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: messageContent,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      
      // Only show error toast for API key issues
      if (error.message?.includes('API key') || error.message?.includes('401')) {
        const hasShownError = sessionStorage.getItem('ai_supply_chain_api_key_error');
        if (!hasShownError) {
          toast.error('Vui lòng cấu hình OpenAI API key trong file .env', { 
            duration: 5000,
            id: 'ai-api-key-error'
          });
          sessionStorage.setItem('ai_supply_chain_api_key_error', 'true');
        }
      }
    } finally {
      setIsLoading(false);
    }
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
        aria-label="Toggle AI Supply Chain Assistant"
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
                    } else if (toolCall.type === 'analysis') {
                      return (
                        <div key={index} className="my-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center space-x-2 mb-2">
                            <Activity className="w-5 h-5 text-blue-600" />
                            <h4 className="text-sm font-semibold text-blue-800">Phân tích chuỗi cung ứng</h4>
                          </div>
                          <div className="text-sm text-gray-700 space-y-1">
                            <p><strong>ID:</strong> {toolCall.supplyChainId}</p>
                            <p><strong>Lô thuốc:</strong> {toolCall.supplyChain?.drugBatchNumber || 'N/A'}</p>
                            <p className="mt-2 whitespace-pre-wrap">{toolCall.result}</p>
                          </div>
                        </div>
                      );
                    } else if (toolCall.type === 'risk_prediction') {
                      return (
                        <div key={index} className="my-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                          <div className="flex items-center space-x-2 mb-2">
                            <AlertTriangle className="w-5 h-5 text-orange-600" />
                            <h4 className="text-sm font-semibold text-orange-800">Dự đoán rủi ro</h4>
                          </div>
                          <div className="text-sm text-gray-700 whitespace-pre-wrap">
                            {toolCall.result}
                          </div>
                        </div>
                      );
                    } else if (toolCall.type === 'optimization') {
                      return (
                        <div key={index} className="my-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center space-x-2 mb-2">
                            <Zap className="w-5 h-5 text-green-600" />
                            <h4 className="text-sm font-semibold text-green-800">Gợi ý tối ưu hóa</h4>
                          </div>
                          <div className="text-sm text-gray-700 whitespace-pre-wrap">
                            {toolCall.result}
                          </div>
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

          {/* Quick Actions */}
          {messages.length === 1 && (
            <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
              <p className="text-xs text-gray-600 mb-2">Câu hỏi nhanh:</p>
              <div className="flex flex-wrap gap-2">
                {quickActions.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInputValue(action.query);
                      setTimeout(() => handleSendMessage(), 100);
                    }}
                    className="px-3 py-1 text-xs bg-white border border-gray-300 rounded-full hover:bg-blue-50 hover:border-blue-300 transition-colors"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-gray-200 bg-white rounded-b-lg">
            <div className="flex items-end space-x-2">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Hỏi về chuỗi cung ứng, rủi ro, tối ưu hóa..."
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

export default AISupplyChainAssistant;
