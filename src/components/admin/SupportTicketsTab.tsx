'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/context/ToastContext';
import { useConfirmation } from '@/context/ConfirmationContext';

export default function SupportTicketsTab() {
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [replyingTicket, setReplyingTicket] = useState<any | null>(null);
    const [replyMessage, setReplyMessage] = useState('');
    const { showToast } = useToast();

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        try {
            const res = await fetch('/api/admin/support/tickets');
            const data = await res.json();
            // Ensure data is an array before setting state to avoid "map is not a function" error
            setTickets(Array.isArray(data) ? data : []);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch tickets', error);
            showToast('Failed to load tickets', 'error');
            setTickets([]); // Fallback to empty array
            setLoading(false);
        }
    };

    const handleReplySubmit = async () => {
        if (!replyingTicket || !replyMessage) return;

        try {
            const res = await fetch('/api/admin/support/reply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ticketId: replyingTicket.id,
                    message: replyMessage,
                    userEmail: replyingTicket.email,
                    userName: replyingTicket.name,
                    ticketSubject: replyingTicket.subject
                }),
            });

            if (res.ok) {
                showToast('Reply sent successfully', 'success');
                setReplyingTicket(null);
                setReplyMessage('');
                fetchTickets();
            } else {
                showToast('Failed to send reply', 'error');
            }
        } catch (error) {
            console.error('Failed to send reply', error);
            showToast('Error sending reply', 'error');
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading tickets...</div>;

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                    <h3 className="text-xl font-bold text-slate-800">Support Tickets</h3>
                    <p className="text-sm text-slate-500 mt-1">Manage and respond to support inquiries.</p>
                </div>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                    {tickets.filter(t => t.status === 'open').length} Open
                </span>
            </div>

            <div className="divide-y divide-slate-100">
                {tickets.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                        <i className="fas fa-inbox text-4xl mb-3 opacity-50"></i>
                        <p>No support tickets found.</p>
                    </div>
                ) : (
                    tickets.map((ticket) => (
                        <div key={ticket.id} className="p-6 hover:bg-slate-50 transition-colors">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                    <h4 className="font-bold text-slate-800 text-lg">{ticket.subject}</h4>
                                    <span className={`
                                        px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide
                                        ${ticket.status === 'open' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}
                                    `}>
                                        {ticket.status}
                                    </span>
                                </div>
                                <span className="text-xs text-slate-400 font-medium">
                                    {new Date(ticket.created_at).toLocaleDateString()}
                                </span>
                            </div>

                            <div className="flex items-center gap-2 mb-4 text-sm text-slate-500">
                                <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                                    {ticket.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="font-medium text-slate-700">{ticket.name}</span>
                                <span className="text-slate-300">•</span>
                                <span>{ticket.email}</span>
                            </div>

                            <div className="bg-slate-50 rounded-xl p-4 text-slate-600 text-sm leading-relaxed mb-4 border border-slate-100">
                                {ticket.message}
                            </div>

                            {ticket.status === 'open' && (
                                <div className="flex justify-end">
                                    <button
                                        onClick={() => setReplyingTicket(ticket)}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow active:scale-95"
                                    >
                                        <i className="fas fa-reply"></i> Reply
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Reply Modal */}
            {replyingTicket && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-800">Reply to {replyingTicket.name}</h3>
                            <button
                                onClick={() => setReplyingTicket(null)}
                                className="text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100 text-sm text-blue-800">
                                <strong className="block text-xs uppercase tracking-wider text-blue-500 mb-1">Subject</strong>
                                {replyingTicket.subject}
                            </div>

                            <label className="block text-sm font-semibold text-slate-700 mb-2">Your Message</label>
                            <textarea
                                value={replyMessage}
                                onChange={(e) => setReplyMessage(e.target.value)}
                                className="w-full h-32 p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none text-slate-700 transition-all placeholder:text-slate-400"
                                placeholder="Type your reply here..."
                                autoFocus
                            />
                        </div>

                        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                            <button
                                onClick={() => setReplyingTicket(null)}
                                className="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-200 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReplySubmit}
                                disabled={!replyMessage.trim()}
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg font-semibold shadow-md shadow-blue-500/20 transition-all active:scale-95 flex items-center gap-2"
                            >
                                <i className="fas fa-paper-plane"></i> Send Reply
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
