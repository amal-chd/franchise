/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';

export default function ChatTab() {
    const [sessions, setSessions] = useState<any[]>([]);
    const [activeSession, setActiveSession] = useState<number | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchSessions();
    }, []);

    useEffect(() => {
        if (activeSession) {
            fetchMessages(activeSession);
            // Poll for messages every 5 seconds
            const interval = setInterval(() => fetchMessages(activeSession), 5000);
            return () => clearInterval(interval);
        }
    }, [activeSession]);

    const fetchSessions = async () => {
        try {
            // Placeholder: fetch from new endpoint or use existing logic if adapted
            // For now, let's assume we implement `GET /api/admin/chat/sessions`
            const res = await fetch('/api/admin/chat/sessions');
            if (res.ok) {
                const data = await res.json();
                setSessions(data);
            }
        } catch (error) {
            console.error('Failed to fetch sessions', error);
        }
    };

    const fetchMessages = async (sessionId: number) => {
        try {
            const res = await fetch(`/api/chat/messages?sessionId=${sessionId}`);
            if (res.ok) {
                const data = await res.json();
                setMessages(data);
            }
        } catch (error) {
            console.error('Failed to fetch messages', error);
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !activeSession) return;
        try {
            await fetch('/api/chat/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: activeSession,
                    senderType: 'admin',
                    senderId: 1, // Hardcoded admin ID for now
                    message: newMessage
                })
            });
            setNewMessage('');
            fetchMessages(activeSession);
        } catch (error) {
            console.error('Failed to send message', error);
        }
    };

    return (
        <div className="flex h-[600px] border rounded-lg bg-white overflow-hidden">
            {/* Sidebar: Chat List */}
            <div className="w-1/3 border-r bg-gray-50 flex flex-col">
                <div className="p-4 border-b">
                    <h3 className="font-bold text-lg">Active Support Chats</h3>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {sessions.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">No active chats</div>
                    ) : (
                        sessions.map((session) => (
                            <div
                                key={session.id}
                                onClick={() => setActiveSession(session.id)}
                                className={`p-4 border-b cursor-pointer hover:bg-gray-100 ${activeSession === session.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
                            >
                                <div className="font-medium">Franchise #{session.franchise_id}</div>
                                <div className="text-xs text-gray-500">{new Date(session.last_message_at).toLocaleString()}</div>
                                <div className="text-sm text-gray-600 truncate">
                                    {session.last_message_preview || 'Open to view'}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="w-2/3 flex flex-col">
                {activeSession ? (
                    <>
                        <div className="p-4 border-b flex justify-between items-center bg-white shadow-sm">
                            <h3 className="font-bold">Chat #{activeSession}</h3>
                            <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">Active</span>
                        </div>

                        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50">
                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex ${msg.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[70%] p-3 rounded-lg ${msg.sender_type === 'admin' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border rounded-bl-none'}`}>
                                        <p>{msg.message}</p>
                                        <div className={`text-[10px] mt-1 text-right ${msg.sender_type === 'admin' ? 'text-blue-100' : 'text-gray-400'}`}>
                                            {new Date(msg.created_at).toLocaleTimeString()}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-4 border-t bg-white">
                            <div className="flex gap-2">
                                <input
                                    className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Type reply..."
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                />
                                <button
                                    onClick={sendMessage}
                                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                                >
                                    <i className="fas fa-paper-plane mr-2"></i>
                                    Send
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-400">
                        Select a chat to start messaging
                    </div>
                )}
            </div>
        </div>
    );
}
