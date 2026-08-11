import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import {
  MessageSquare, Send, Search, Paperclip, Video, Phone,
  Users, ArrowLeft, Smile, Plus, X, Check
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { ChatRoom, Message, Profile } from '@/lib/types';
import { PageTransition, Skeleton, EmptyState } from '@/components/ui/Animations';
import { Avatar } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/lib/toast';
import { cn, formatTime, relativeTime } from '@/lib/utils';

export function MessengerPage() {
  const { profile } = useAuth();
  const { notify } = useToast();
  const [searchParams] = useSearchParams();
  const [rooms, setRooms] = useState<(ChatRoom & { other_user?: Profile; last_message?: Message })[]>([]);
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [messages, setMessages] = useState<(Message & { sender: Profile })[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const canManage = profile?.role === 'admin' || profile?.role === 'moderator';

  const loadRooms = useCallback(async () => {
    if (!profile) return;
    const { data: memberRooms } = await supabase
      .from('chat_room_members')
      .select('room_id')
      .eq('user_id', profile.id);

    if (!memberRooms || memberRooms.length === 0) {
      // Get department/project rooms
      const { data: deptRooms } = await supabase
        .from('chat_rooms')
        .select('*')
        .in('type', ['department', 'project', 'group']);

      const roomsWithInfo = await Promise.all((deptRooms || []).map(async (room) => {
        const { data: lastMsg } = await supabase
          .from('messages')
          .select('*')
          .eq('room_id', room.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        return { ...room, last_message: lastMsg as Message };
      }));
      setRooms(roomsWithInfo as (ChatRoom & { last_message?: Message })[]);
      setLoading(false);
      return;
    }

    const roomIds = memberRooms.map(m => m.room_id);
    const { data: roomData } = await supabase
      .from('chat_rooms')
      .select('*')
      .in('id', roomIds);

    const roomsWithInfo = await Promise.all((roomData || []).map(async (room) => {
      if (room.type === 'direct') {
        const { data: otherMember } = await supabase
          .from('chat_room_members')
          .select('user_id')
          .eq('room_id', room.id)
          .neq('user_id', profile.id)
          .maybeSingle();
        if (otherMember) {
          const { data: otherUser } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', otherMember.user_id)
            .maybeSingle();
          room.other_user = otherUser as Profile;
        }
      }
      const { data: lastMsg } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', room.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return { ...room, last_message: lastMsg as Message };
    }));

    setRooms(roomsWithInfo as (ChatRoom & { other_user?: Profile; last_message?: Message })[]);
    setLoading(false);
  }, [profile]);

  const loadProfiles = useCallback(async () => {
    if (!profile) return;
    const { data } = await supabase.from('profiles').select('*').neq('id', profile.id).order('full_name');
    setAllProfiles((data as Profile[]) || []);
  }, [profile]);

  useEffect(() => {
    loadRooms();
    loadProfiles();
  }, [loadRooms, loadProfiles]);

  // Open room from query param (e.g. when navigating from Team page)
  useEffect(() => {
    const roomParam = searchParams.get('room');
    if (roomParam && !loading) {
      handleSelectRoom(roomParam);
    }
  }, [searchParams, loading]);

  // Real-time messages
  useEffect(() => {
    if (!activeRoom) return;
    const channel = supabase
      .channel(`messages:${activeRoom}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${activeRoom}` },
        (payload) => {
          const newMsg = payload.new as Message;
          (async () => {
            const { data: sender } = await supabase.from('profiles').select('*').eq('id', newMsg.sender_id).maybeSingle();
            setMessages(prev => [...prev, { ...newMsg, sender: sender as Profile }]);
          })();
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeRoom]);

  const loadMessages = useCallback(async (roomId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*, sender:profiles!sender_id(*)')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });
    setMessages((data as (Message & { sender: Profile })[]) || []);
  }, []);

  const handleSelectRoom = (roomId: string) => {
    setActiveRoom(roomId);
    loadMessages(roomId);
  };

  const handleSend = async () => {
    if (!input.trim() || !activeRoom || !profile) return;
    const content = input;
    setInput('');

    const { data } = await supabase
      .from('messages')
      .insert({ room_id: activeRoom, sender_id: profile.id, content })
      .select('*, sender:profiles!sender_id(*)')
      .single();

    if (data) {
      setMessages(prev => [...prev, data as Message & { sender: Profile }]);
    }
  };

  const startDirectChat = async (otherUserId: string) => {
    if (!profile) return;
    // Check if direct room already exists
    const { data: myRooms } = await supabase
      .from('chat_room_members')
      .select('room_id')
      .eq('user_id', profile.id);

    if (myRooms && myRooms.length > 0) {
      for (const rm of myRooms) {
        const { data: room } = await supabase.from('chat_rooms').select('*').eq('id', rm.room_id).eq('type', 'direct').maybeSingle();
        if (room) {
          const { data: otherMember } = await supabase
            .from('chat_room_members')
            .select('user_id')
            .eq('room_id', room.id)
            .neq('user_id', profile.id)
            .maybeSingle();
          if (otherMember?.user_id === otherUserId) {
            handleSelectRoom(room.id);
            return;
          }
        }
      }
    }

    // Create new direct room
    const { data: newRoom } = await supabase
      .from('chat_rooms')
      .insert({ type: 'direct', created_by: profile.id })
      .select('*')
      .single();

    if (newRoom) {
      await supabase.from('chat_room_members').insert([
        { room_id: newRoom.id, user_id: profile.id },
        { room_id: newRoom.id, user_id: otherUserId },
      ]);
      loadRooms();
      handleSelectRoom(newRoom.id);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const filteredProfiles = search ? allProfiles.filter(p => p.full_name?.toLowerCase().includes(search.toLowerCase())) : [];

  const handleCreateGroup = async (name: string, memberIds: string[]) => {
    if (!profile || !name.trim()) return;
    const { data: newRoom, error } = await supabase.from('chat_rooms').insert({
      name,
      type: 'group',
      created_by: profile.id,
    }).select('*').single();

    if (error || !newRoom) {
      notify({ type: 'error', title: 'Failed to create group', message: error?.message });
      return;
    }

    const inserts = [
      { room_id: newRoom.id, user_id: profile.id },
      ...memberIds.map(id => ({ room_id: newRoom.id, user_id: id })),
    ];
    await supabase.from('chat_room_members').insert(inserts);
    notify({ type: 'success', title: 'Group chat created' });
    setShowCreateGroup(false);
    loadRooms();
    handleSelectRoom(newRoom.id);
  };

  return (
    <PageTransition>
      <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
        {/* Sidebar - room list */}
        <div className={cn('w-full md:w-80 border-r border-ink-200 flex flex-col', activeRoom && 'hidden md:flex')}>
          <div className="p-4 border-b border-ink-100">
            <div className="flex items-center justify-between mb-3">
              <h1 className="text-xl font-bold font-display text-ink-900">Messages</h1>
              {canManage && (
                <button onClick={() => setShowCreateGroup(true)} className="p-2 rounded-lg bg-brand-100 text-brand-600 hover:bg-brand-200 transition-colors" title="Create group chat">
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search people to chat..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-ink-100 border border-transparent text-sm focus:outline-none focus:bg-white focus:border-ink-200 transition-all"
              />
            </div>
          </div>

          {/* Search results - profiles to start chat */}
          {search && filteredProfiles.length > 0 && (
            <div className="p-2 border-b border-ink-100 max-h-48 overflow-y-auto">
              <p className="px-2 py-1 text-[10px] font-semibold text-ink-400 uppercase">Start new chat</p>
              {filteredProfiles.map(p => (
                <button
                  key={p.id}
                  onClick={() => { startDirectChat(p.id); setSearch(''); }}
                  className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-ink-100 transition-colors text-left"
                >
                  <Avatar src={p.avatar_url} name={p.full_name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink-900 truncate">{p.full_name}</p>
                    <p className="text-xs text-ink-400">{p.position || 'Employee'}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Room list */}
          <div className="flex-1 overflow-y-auto p-2">
            {loading ? (
              [1, 2, 3].map(i => <Skeleton key={i} className="h-16 mb-2" />)
            ) : rooms.length === 0 ? (
              <EmptyState icon={<MessageSquare className="w-8 h-8" />} title="No conversations" description="Search for people to start chatting." />
            ) : (
              rooms.map(room => {
                const name = room.type === 'direct' ? room.other_user?.full_name || 'Unknown' : room.name || 'Group';
                const avatar = room.type === 'direct' ? room.other_user?.avatar_url : null;
                return (
                  <button
                    key={room.id}
                    onClick={() => handleSelectRoom(room.id)}
                    className={cn('w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left',
                      activeRoom === room.id ? 'bg-brand-50' : 'hover:bg-ink-100')}
                  >
                    <Avatar src={avatar} name={name} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-ink-900 text-sm truncate">{name}</p>
                      <p className="text-xs text-ink-400 truncate">
                        {room.last_message ? room.last_message.content : 'No messages yet'}
                      </p>
                    </div>
                    {room.last_message && (
                      <span className="text-[10px] text-ink-400 shrink-0">{formatTime(room.last_message.created_at)}</span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Chat area */}
        <div className={cn('flex-1 flex flex-col', !activeRoom && 'hidden md:flex')}>
          {!activeRoom ? (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState icon={<MessageSquare className="w-8 h-8" />} title="Select a conversation" description="Choose a chat from the list to start messaging." />
            </div>
          ) : (
            <>
              {/* Chat header */}
              {(() => {
                const room = rooms.find(r => r.id === activeRoom);
                const name = room?.type === 'direct' ? room.other_user?.full_name || 'Chat' : room?.name || 'Group';
                const avatar = room?.type === 'direct' ? room.other_user?.avatar_url : null;
                return (
                  <div className="flex items-center gap-3 p-4 border-b border-ink-100 bg-white">
                    <button onClick={() => setActiveRoom(null)} className="md:hidden p-2 rounded-lg hover:bg-ink-100">
                      <ArrowLeft className="w-5 h-5 text-ink-500" />
                    </button>
                    <Avatar src={avatar} name={name} size="md" />
                    <div className="flex-1">
                      <p className="font-semibold text-ink-900">{name}</p>
                      <p className="text-xs text-success-500">Online</p>
                    </div>
                    <button className="p-2.5 rounded-xl hover:bg-ink-100 transition-colors">
                      <Phone className="w-5 h-5 text-ink-500" />
                    </button>
                    <button className="p-2.5 rounded-xl hover:bg-ink-100 transition-colors">
                      <Video className="w-5 h-5 text-ink-500" />
                    </button>
                  </div>
                );
              })()}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-ink-50/50">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-sm text-ink-400">No messages yet. Say hello!</div>
                ) : (
                  messages.map(msg => {
                    const isOwn = msg.sender_id === profile?.id;
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn('flex gap-2', isOwn ? 'flex-row-reverse' : 'flex-row')}
                      >
                        {!isOwn && <Avatar src={msg.sender?.avatar_url} name={msg.sender?.full_name} size="xs" />}
                        <div className={cn('max-w-[70%]')}>
                          {!isOwn && <p className="text-xs text-ink-400 mb-1 ml-1">{msg.sender?.full_name}</p>}
                          <div className={cn('px-4 py-2.5 rounded-2xl text-sm',
                            isOwn ? 'bg-brand-600 text-white rounded-tr-md' : 'bg-white border border-ink-200 text-ink-900 rounded-tl-md')}>
                            {msg.content}
                          </div>
                          <p className={cn('text-[10px] text-ink-400 mt-1', isOwn ? 'text-right mr-1' : 'ml-1')}>{formatTime(msg.created_at)}</p>
                        </div>
                      </motion.div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-ink-100 bg-white">
                <div className="flex items-center gap-2">
                  <button className="p-2.5 rounded-xl hover:bg-ink-100 transition-colors">
                    <Paperclip className="w-5 h-5 text-ink-400" />
                  </button>
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2.5 rounded-xl bg-ink-100 border border-transparent text-sm focus:outline-none focus:bg-white focus:border-ink-200 transition-all"
                  />
                  <button className="p-2.5 rounded-xl hover:bg-ink-100 transition-colors">
                    <Smile className="w-5 h-5 text-ink-400" />
                  </button>
                  <button
                    onClick={handleSend}
                    disabled={!input.trim()}
                    className="p-2.5 rounded-xl bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Create group chat modal */}
      {showCreateGroup && (
        <CreateGroupModal
          profiles={allProfiles}
          onClose={() => setShowCreateGroup(false)}
          onCreate={handleCreateGroup}
        />
      )}
    </PageTransition>
  );
}

function CreateGroupModal({ profiles, onClose, onCreate }: {
  profiles: Profile[];
  onClose: () => void;
  onCreate: (name: string, memberIds: string[]) => void;
}) {
  const [name, setName] = useState('');
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) => setSelected(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);

  const handleSubmit = () => {
    if (!name.trim()) return;
    onCreate(name, selected);
    setName(''); setSelected([]);
  };

  return (
    <Modal open={true} onClose={onClose} title="Create Group Chat" size="md">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1.5">Group Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-field" placeholder="e.g. Marketing Team" />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1.5">Add Members ({selected.length})</label>
          <div className="space-y-1.5 max-h-56 overflow-y-auto scrollbar-hide">
            {profiles.map(p => (
              <label key={p.id} className={cn(
                'flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-colors',
                selected.includes(p.id) ? 'bg-brand-50 ring-1 ring-brand-200' : 'hover:bg-ink-50'
              )}>
                <input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggle(p.id)} className="w-4 h-4 rounded accent-brand-600" />
                <Avatar src={p.avatar_url} name={p.full_name} size="xs" />
                <span className="text-sm font-medium text-ink-900">{p.full_name}</span>
                <span className="text-xs text-ink-400 ml-auto">{p.position || ''}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit} className="btn-primary">Create Group</button>
        </div>
      </div>
    </Modal>
  );
}
