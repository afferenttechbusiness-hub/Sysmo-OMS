import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Wallet, ArrowDownToLine, ArrowUpFromLine, Send, Download,
  TrendingUp, TrendingDown, Clock, CheckCircle2, XCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { Transaction } from '@/lib/types';
import { PageTransition, FadeIn, Skeleton, EmptyState, StaggerContainer, StaggerItem } from '@/components/ui/Animations';
import { Badge } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/lib/toast';
import { cn, formatCurrency, formatDate, statusColor } from '@/lib/utils';
import { useWallet, useProfiles } from '@/lib/hooks';

export function TransactionPage() {
  const { profile } = useAuth();
  const { notify } = useToast();
  const { wallet, transactions, loading, reload } = useWallet();
  const { profiles } = useProfiles();
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);

  const handleWithdraw = async (amount: number) => {
    if (!profile || !wallet) return;
    if (amount > Number(wallet.balance)) {
      notify({ type: 'error', title: 'Insufficient balance' });
      return;
    }
    const { error } = await supabase.from('withdrawal_requests').insert({
      user_id: profile.id,
      amount,
    });
    if (error) {
      notify({ type: 'error', title: 'Request failed', message: error.message });
    } else {
      notify({ type: 'success', title: 'Withdrawal requested', message: 'Your request is pending admin approval.' });
      reload();
      setShowWithdraw(false);
    }
  };

  const handleTransfer = async (recipientId: string, amount: number) => {
    if (!profile || !wallet) return;
    if (amount > Number(wallet.balance)) {
      notify({ type: 'error', title: 'Insufficient balance' });
      return;
    }

    // Get recipient wallet
    const { data: recipientWallet } = await supabase.from('wallets').select('*').eq('user_id', recipientId).maybeSingle();
    if (!recipientWallet) {
      notify({ type: 'error', title: 'Recipient wallet not found' });
      return;
    }

    // Create transactions
    await supabase.from('transactions').insert([
      { wallet_id: wallet.id, user_id: profile.id, type: 'transfer_out', amount, status: 'completed', description: 'Transfer to colleague', recipient_id: recipientId },
      { wallet_id: recipientWallet.id, user_id: recipientId, type: 'transfer_in', amount, status: 'completed', description: 'Transfer from colleague', recipient_id: profile.id },
    ]);

    // Update balances
    await supabase.from('wallets').update({ balance: Number(wallet.balance) - amount, updated_at: new Date().toISOString() }).eq('id', wallet.id);
    await supabase.from('wallets').update({ balance: Number(recipientWallet.balance) + amount, updated_at: new Date().toISOString() }).eq('id', recipientWallet.id);

    notify({ type: 'success', title: 'Transfer successful', message: `${formatCurrency(amount)} sent.` });
    reload();
    setShowTransfer(false);
  };

  const totalIn = transactions.filter(t => t.type === 'salary' || t.type === 'transfer_in').reduce((sum, t) => sum + Number(t.amount), 0);
  const totalOut = transactions.filter(t => t.type === 'withdrawal' || t.type === 'transfer_out').reduce((sum, t) => sum + Number(t.amount), 0);

  return (
    <PageTransition>
      <div className="p-4 lg:p-8 space-y-6">
        <FadeIn>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold font-display text-ink-900">Transactions</h1>
            <p className="text-ink-500 mt-1">Your wallet and financial activity</p>
          </div>
        </FadeIn>

        {/* Wallet card */}
        <FadeIn delay={0.1}>
          <div className="card overflow-hidden">
            <div className="gradient-bg p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Wallet className="w-5 h-5" />
                  <span className="text-sm opacity-80">Your Balance</span>
                </div>
                <Badge className="bg-white/20 text-white">{wallet?.currency || 'BDT'}</Badge>
              </div>
              <p className="text-4xl font-bold font-display">
                {loading ? '...' : formatCurrency(Number(wallet?.balance || 0), wallet?.currency || 'BDT')}
              </p>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowWithdraw(true)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/20 backdrop-blur-md hover:bg-white/30 transition-colors text-sm font-medium">
                  <ArrowDownToLine className="w-4 h-4" /> Withdraw
                </button>
                <button onClick={() => setShowTransfer(true)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/20 backdrop-blur-md hover:bg-white/30 transition-colors text-sm font-medium">
                  <Send className="w-4 h-4" /> Transfer
                </button>
              </div>
            </div>
          </div>
        </FadeIn>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-4">
          <FadeIn delay={0.2}>
            <div className="card p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-success-100 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-success-600" />
                </div>
                <div>
                  <p className="text-xs text-ink-400">Total In</p>
                  <p className="text-xl font-bold text-ink-900">{formatCurrency(totalIn, wallet?.currency || 'BDT')}</p>
                </div>
              </div>
            </div>
          </FadeIn>
          <FadeIn delay={0.3}>
            <div className="card p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-error-100 flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-error-600" />
                </div>
                <div>
                  <p className="text-xs text-ink-400">Total Out</p>
                  <p className="text-xl font-bold text-ink-900">{formatCurrency(totalOut, wallet?.currency || 'BDT')}</p>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>

        {/* Transaction list */}
        <FadeIn delay={0.2}>
          <div className="card p-6">
            <h3 className="font-semibold text-ink-900 mb-4">Transaction History</h3>
            {loading ? (
              <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16" />)}</div>
            ) : transactions.length === 0 ? (
              <EmptyState icon={<Wallet className="w-8 h-8" />} title="No transactions" description="Your transaction history will appear here." />
            ) : (
              <StaggerContainer className="space-y-2">
                {transactions.map(txn => {
                  const isIn = txn.type === 'salary' || txn.type === 'transfer_in';
                  const Icon = txn.type === 'salary' ? Download : txn.type === 'withdrawal' ? ArrowUpFromLine : Send;
                  return (
                    <StaggerItem key={txn.id}>
                      <motion.div whileHover={{ x: 4 }} className="flex items-center gap-4 p-3 rounded-xl hover:bg-ink-50 transition-colors">
                        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                          isIn ? 'bg-success-100 text-success-600' : 'bg-error-100 text-error-600')}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-ink-900 capitalize">
                            {txn.type.replace('_', ' ')}
                            {txn.recipient_id && (() => {
                              const recipient = profiles.find(p => p.id === txn.recipient_id);
                              return recipient ? ` → ${recipient.full_name}` : '';
                            })()}
                          </p>
                          <p className="text-xs text-ink-400">{txn.description || formatDate(txn.created_at)} · {formatDate(txn.created_at, 'MMM d, h:mm a')}</p>
                        </div>
                        <div className="text-right">
                          <p className={cn('text-sm font-semibold', isIn ? 'text-success-600' : 'text-error-600')}>
                            {isIn ? '+' : '-'}{formatCurrency(Number(txn.amount), wallet?.currency || 'BDT')}
                          </p>
                          <Badge className={cn(statusColor(txn.status), 'mt-1')}>{txn.status}</Badge>
                        </div>
                      </motion.div>
                    </StaggerItem>
                  );
                })}
              </StaggerContainer>
            )}
          </div>
        </FadeIn>
      </div>

      <WithdrawModal open={showWithdraw} onClose={() => setShowWithdraw(false)} maxAmount={Number(wallet?.balance || 0)} onWithdraw={handleWithdraw} />
      <TransferModal open={showTransfer} onClose={() => setShowTransfer(false)} maxAmount={Number(wallet?.balance || 0)} profiles={profiles} onTransfer={handleTransfer} />
    </PageTransition>
  );
}

function WithdrawModal({ open, onClose, maxAmount, onWithdraw }: {
  open: boolean;
  onClose: () => void;
  maxAmount: number;
  onWithdraw: (amount: number) => void;
}) {
  const [amount, setAmount] = useState('');
  return (
    <Modal open={open} onClose={onClose} title="Withdraw Funds" size="sm">
      <div className="space-y-4">
        <p className="text-sm text-ink-500">Available balance: <span className="font-semibold text-ink-900">{formatCurrency(maxAmount)}</span></p>
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1.5">Amount</label>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="input-field" placeholder="0.00" max={maxAmount} />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={() => { onWithdraw(Number(amount)); setAmount(''); }} className="btn-primary" disabled={!amount || Number(amount) <= 0}>
            Request Withdrawal
          </button>
        </div>
      </div>
    </Modal>
  );
}

function TransferModal({ open, onClose, maxAmount, profiles, onTransfer }: {
  open: boolean;
  onClose: () => void;
  maxAmount: number;
  profiles: { id: string; full_name: string | null; avatar_url: string | null }[];
  onTransfer: (recipientId: string, amount: number) => void;
}) {
  const [recipientId, setRecipientId] = useState('');
  const [amount, setAmount] = useState('');
  return (
    <Modal open={open} onClose={onClose} title="Transfer Funds" size="sm">
      <div className="space-y-4">
        <p className="text-sm text-ink-500">Available balance: <span className="font-semibold text-ink-900">{formatCurrency(maxAmount)}</span></p>
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1.5">Recipient</label>
          <select value={recipientId} onChange={(e) => setRecipientId(e.target.value)} className="input-field">
            <option value="">Select a colleague...</option>
            {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1.5">Amount</label>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="input-field" placeholder="0.00" max={maxAmount} />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={() => { onTransfer(recipientId, Number(amount)); setRecipientId(''); setAmount(''); }} className="btn-primary" disabled={!recipientId || !amount || Number(amount) <= 0}>
            Send Transfer
          </button>
        </div>
      </div>
    </Modal>
  );
}
