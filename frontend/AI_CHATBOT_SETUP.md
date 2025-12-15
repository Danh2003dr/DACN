# AI Data Analyst Chatbot - Setup Guide

## 📋 Overview

The AI Chatbot Widget is a floating chat interface that allows users to ask questions about their drug, order, and inventory data. It uses OpenAI's GPT-3.5-turbo model to analyze the data and provide intelligent answers.

## 🚀 Features

- ✅ Floating button in bottom-right corner
- ✅ Modern, clean UI with Tailwind CSS
- ✅ Real-time data fetching from APIs (drugs, orders, inventory)
- ✅ OpenAI GPT-3.5-turbo integration
- ✅ Fallback local analysis if OpenAI fails
- ✅ Typing indicator
- ✅ Error handling
- ✅ Auto-scroll to latest message
- ✅ Keyboard shortcuts (Enter to send, Shift+Enter for new line)

## 📦 Installation

The component is already integrated into the app. No additional installation needed.

## ⚙️ Configuration

### 1. OpenAI API Key

Add your OpenAI API key to the `.env` file in the `frontend` directory:

```env
REACT_APP_OPENAI_API_KEY=sk-your-api-key-here
```

**Important:** 
- Never commit your API key to version control
- Add `.env` to `.gitignore`
- In production, consider calling OpenAI API through your backend for security

### 2. Backend API

Make sure your backend is running and accessible. The component uses:
- `drugAPI.getDrugs()` - Fetch drugs data
- `orderAPI.getOrders()` - Fetch orders data
- `inventoryAPI.getInventory()` - Fetch inventory data

## 🎨 Usage

The chatbot widget is automatically available on all pages. Users can:

1. Click the floating blue button in the bottom-right corner
2. Ask questions like:
   - "Which drug is running low?"
   - "Revenue of last month?"
   - "How many drugs do we have?"
   - "Show me low stock items"
   - "What's the total inventory value?"

## 🔧 Customization

### Change Chat Window Size

Edit `AIChatWidget.jsx`:

```jsx
// Change width and height
<div className="fixed bottom-24 right-6 z-50 w-96 h-[600px] ...">
  // w-96 = 384px width, h-[600px] = 600px height
</div>
```

### Change Colors

The component uses Tailwind CSS classes. You can modify:
- Primary color: `bg-blue-600` → change to your preferred color
- Header gradient: `from-blue-600 to-blue-700`
- Button colors in the floating button

### Modify System Prompt

Edit the `systemPrompt` variable in `handleSendMessage` function:

```jsx
const systemPrompt = `Your custom prompt here...`;
```

## 🛡️ Security Considerations

### Current Implementation (Frontend)

⚠️ **Warning:** The current implementation calls OpenAI API directly from the frontend, which exposes your API key in the client-side code.

### Recommended: Backend Proxy

For production, create a backend endpoint that:
1. Receives the user's question
2. Fetches the data from your database
3. Calls OpenAI API with the API key stored securely on the server
4. Returns the response to the frontend

Example backend endpoint:

```javascript
// routes/ai.js
router.post('/ai/chat', authenticate, async (req, res) => {
  try {
    const { question } = req.body;
    
    // Fetch data
    const drugs = await Drug.find({});
    const orders = await Order.find({});
    const inventory = await Inventory.find({});
    
    // Call OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `${question}\n\nData: ${JSON.stringify({ drugs, orders, inventory })}` }
      ]
    });
    
    res.json({ success: true, data: { response: response.choices[0].message.content } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
```

Then update `AIChatWidget.jsx` to call your backend:

```jsx
const response = await api.post('/ai/chat', { question: userMessage });
const aiResponse = response.data.data.response;
```

## 🐛 Troubleshooting

### OpenAI API Key Error

If you see "API key" error:
1. Check `.env` file has `REACT_APP_OPENAI_API_KEY`
2. Restart the development server after adding the key
3. Verify the key is valid at https://platform.openai.com/api-keys

### No Data Available

If the chatbot says "no data":
1. Check backend is running
2. Verify API endpoints are accessible
3. Check browser console for errors
4. Ensure user is authenticated (token in localStorage)

### Fallback Mode

If OpenAI API fails, the component automatically falls back to local analysis which can answer:
- Low stock questions
- Revenue questions
- Total counts

## 📝 Example Questions

Users can ask:
- "Thuốc nào đang có số lượng thấp?"
- "Doanh thu tháng trước là bao nhiêu?"
- "Có bao nhiêu loại thuốc?"
- "Đơn hàng nào đang chờ xử lý?"
- "Kho hàng nào có nhiều thuốc nhất?"

## 🔄 Future Enhancements

Possible improvements:
1. Backend proxy for OpenAI API (security)
2. Chat history persistence
3. Export chat conversation
4. Voice input support
5. Multi-language support
6. Custom data sources
7. Advanced analytics queries
8. Chart generation from queries

## 📚 Files

- `frontend/src/components/AIChatWidget.jsx` - Main component
- `frontend/src/App.js` - Integration point
- `frontend/src/utils/api.js` - API functions used

## 🎯 Testing

1. Start the frontend: `npm start`
2. Login to the application
3. Click the floating chat button
4. Ask a question
5. Verify response appears

## 📞 Support

For issues or questions, check:
- Browser console for errors
- Network tab for API calls
- OpenAI API status: https://status.openai.com/

