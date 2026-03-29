import { getReviews, getEmployees } from '../actions';
import TalentoClient from './TalentoClient';

export const dynamic = 'force-dynamic';

export default async function TalentoPage() {
  const [reviews, employees] = await Promise.all([
    getReviews(),
    getEmployees(),
  ]);
  return <TalentoClient initialReviews={reviews} employees={employees} />;
}
