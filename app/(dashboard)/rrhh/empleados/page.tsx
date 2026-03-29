import { getEmployees, getRrhhKpis } from '../actions';
import EmpleadosClient from './EmpleadosClient';

export const dynamic = 'force-dynamic';

export default async function EmpleadosPage() {
  const [employees, kpis] = await Promise.all([
    getEmployees(),
    getRrhhKpis(),
  ]);
  return <EmpleadosClient initialEmployees={employees} kpis={kpis} />;
}
