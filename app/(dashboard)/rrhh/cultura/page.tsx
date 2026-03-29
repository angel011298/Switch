import { getLeaveRequests, getEmployees } from '../actions';
import CulturaClient from './CulturaClient';

export const dynamic = 'force-dynamic';

export default async function CulturaPage() {
  const [requests, employees] = await Promise.all([
    getLeaveRequests(),
    getEmployees(),
  ]);
  return <CulturaClient initialRequests={requests} employees={employees} />;
}
