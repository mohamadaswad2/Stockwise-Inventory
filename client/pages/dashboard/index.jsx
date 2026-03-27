/**
 * /dashboard — Main dashboard page with stats and low-stock alerts.
 */
import Head from 'next/head';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import ProtectedRoute from '../../components/layout/ProtectedRoute';
import AppLayout from '../../components/layout/AppLayout';
import StatsGrid from '../../components/dashboard/StatsGrid';
import LowStockTable from '../../components/dashboard/LowStockTable';
import { useDashboard } from '../../hooks/useDashboard';
import { useAuth } from '../../contexts/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();
  const { stats, loading } = useDashboard();

  return (
    <ProtectedRoute>
      <AppLayout>
        <Head><title>Dashboard — StockWise</title></Head>
        <div className="flex items-start justify-between mb-6 gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800">
              Good day, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">Here's your inventory at a glance.</p>
          </div>
          <Link href="/inventory" className="btn-primary flex-shrink-0">
            <Plus size={16} /> Add Item
          </Link>
        </div>
        <StatsGrid stats={stats} loading={loading} />
        <div className="mt-6">
          <LowStockTable items={stats?.low_stock_items ?? []} />
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
