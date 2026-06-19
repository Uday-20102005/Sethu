import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Send, User, Search, Loader2 } from "lucide-react";
import { chatApi } from "../../api/resources";
import { useSocket } from "../../context/SocketContext";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { format, parseISO, isToday, isYesterday } from "date-fns";

function formatMsgTime(iso) {
  if (!iso) return "";
  const d = parseISO(iso);
  if (isToday(d)) return format(d, "HH:mm");
  if (isYesterday(d)) return "Yesterday, " + format(d, "HH:mm");
  return format(d, "dd MMM, HH:mm");
}

export default function Chat() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgInput, setMsgInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sending, setSending] = useState(false);
  
  const messagesEndRef = useRef(null);
  const requestedConvId = location.state?.conversationId;

  const initialLoadDone = useRef(false);

  // Load conversations
  useEffect(() => {
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;
    chatApi.getConversations().then(res => {
      const convs = res.data || [];
      setConversations(convs);
      setLoading(false);
      if (requestedConvId) {
        const target = convs.find(c => c.id === requestedConvId);
        if (target) {
          setActiveConv(target);
          navigate(location.pathname, { replace: true, state: {} });
        }
      } else if (convs.length > 0) {
        setActiveConv(convs[0]);
      }
    }).catch(() => {
      toast.error("Failed to load chats");
      setLoading(false);
    });
  }, []);

  // Load messages for active conversation
  useEffect(() => {
    if (!activeConv) return;
    chatApi.getMessages(activeConv.id).then(res => {
      setMessages(res.data || []);
      scrollToBottom();
    });
  }, [activeConv?.id]);

  // Handle incoming socket messages
  useEffect(() => {
    if (!socket) return;
    const handleReceiveMessage = (data) => {
      if (activeConv && data.conversation_id === activeConv.id) {
        setMessages(prev => {
          if (prev.some(m => m.id === data.id)) return prev;
          return [...prev, data];
        });
        scrollToBottom();
      }
      setConversations(prev => {
        const idx = prev.findIndex(c => c.id === data.conversation_id);
        if (idx === -1) return prev;
        const newConvs = [...prev];
        newConvs[idx] = { ...newConvs[idx], updated_at: data.created_at, last_message: data.content };
        return newConvs.sort((a,b) => new Date(b.updated_at) - new Date(a.updated_at));
      });
    };

    socket.on("receive_message", handleReceiveMessage);
    return () => socket.off("receive_message", handleReceiveMessage);
  }, [socket, activeConv?.id]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!msgInput.trim() || !activeConv || !socket) return;
    socket.emit("send_message", {
      conversation_id: activeConv.id,
      content: msgInput.trim(),
    });
    setMsgInput("");
    scrollToBottom();
  };

  const getOtherUser = (conv) => {
    const isUserOne = conv.participant_one_id === user.id;
    return {
      id: isUserOne ? conv.participant_two_id : conv.participant_one_id,
      name: isUserOne ? conv.participant_two_name : conv.participant_one_name,
    };
  };

  const filteredConvs = conversations.filter(c => {
    const other = getOtherUser(c);
    return other?.name?.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="page-enter h-[calc(100vh-6rem)] md:h-[calc(100vh-7rem)] flex flex-col -m-6 p-4 md:p-6 overflow-hidden">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-1 overflow-hidden h-full">
        
        {/* Sidebar */}
        <div className={`w-full md:w-80 border-r border-slate-100 flex flex-col ${activeConv ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-900 text-lg mb-4">Messages</h2>
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search chats..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input-field pl-9 bg-slate-50"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center p-8"><Loader2 className="animate-spin text-green-500" /></div>
            ) : filteredConvs.length === 0 ? (
              <div className="text-center p-8 text-slate-500 text-sm">No conversations found</div>
            ) : (
              <div className="divide-y divide-slate-50">
                {filteredConvs.map(conv => {
                  const other = getOtherUser(conv);
                  const isActive = activeConv?.id === conv.id;
                  return (
                    <button
                      key={conv.id}
                      onClick={() => setActiveConv(conv)}
                      className={`w-full flex items-start gap-3 p-4 text-left transition-colors hover:bg-slate-50 ${isActive ? 'bg-slate-50' : ''}`}
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-teal-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                        {other?.name?.charAt(0) || "U"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <p className={`font-semibold text-sm truncate ${isActive ? 'text-green-700' : 'text-slate-900'}`}>{other?.name || "User"}</p>
                          <span className="text-[10px] text-slate-400">{conv.updated_at ? format(parseISO(conv.updated_at), "MMM d") : ""}</span>
                        </div>
                        <p className="text-xs text-slate-500 truncate">{conv.last_message || "Tap to view messages"}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`flex-1 flex flex-col bg-slate-50 ${!activeConv ? 'hidden md:flex' : 'flex'}`}>
          {activeConv ? (
            <>
              {/* Chat Header */}
              <div className="h-16 px-4 md:px-6 bg-white border-b border-slate-100 flex items-center gap-3 flex-shrink-0">
                <button
                  className="md:hidden p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100"
                  onClick={() => setActiveConv(null)}
                >
                  <Search size={20} />
                </button>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-400 to-teal-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                  {getOtherUser(activeConv)?.name?.charAt(0) || "U"}
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm leading-tight">{getOtherUser(activeConv)?.name || "User"}</p>
                  <p className="text-xs text-green-600 font-medium leading-tight">Online</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center px-4">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                      <User size={24} className="text-green-600" />
                    </div>
                    <p className="text-slate-900 font-bold mb-1">Say hello to {getOtherUser(activeConv)?.name?.split(" ")[0]}!</p>
                    <p className="text-slate-500 text-sm">Discuss crop details, pricing, and delivery.</p>
                  </div>
                ) : (
                  messages.map((msg, i) => {
                    const isMe = msg.sender_id === user.id;
                    const showAvatar = i === messages.length - 1 || messages[i + 1].sender_id !== msg.sender_id;
                    return (
                      <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group animate-fade-in`}>
                        <div className={`flex gap-2 max-w-[85%] md:max-w-[70%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                          {/* Avatar */}
                          <div className={`w-6 h-6 rounded-full flex-shrink-0 mt-auto ${showAvatar ? (isMe ? 'bg-slate-200' : 'bg-green-100') : 'opacity-0'} flex items-center justify-center text-[10px] font-bold ${isMe ? 'text-slate-600' : 'text-green-600'}`}>
                            {isMe ? user.name.charAt(0) : getOtherUser(activeConv)?.name?.charAt(0)}
                          </div>
                          
                          {/* Bubble */}
                          <div className="flex flex-col gap-1">
                            <div className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                              isMe 
                                ? 'bg-green-600 text-white rounded-br-sm' 
                                : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'
                            }`}>
                              {msg.content}
                            </div>
                            <span className={`text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity ${isMe ? 'text-right mr-1' : 'ml-1'}`}>
                              {formatMsgTime(msg.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 bg-white border-t border-slate-100">
                <form onSubmit={handleSend} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={msgInput}
                    onChange={e => setMsgInput(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 bg-slate-50 border border-slate-200 text-sm rounded-full px-5 py-3 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!msgInput.trim() || sending}
                    className="w-12 h-12 rounded-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="ml-1" />}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 hidden md:flex">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                <Send size={32} className="text-slate-300 ml-1" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Your Messages</h2>
              <p className="text-slate-500 max-w-xs">Select a conversation from the sidebar or start a new chat from the marketplace.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
