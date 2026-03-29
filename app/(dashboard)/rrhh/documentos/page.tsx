import { getDocuments, getEmployees } from '../actions';
import DocumentosClient from './DocumentosClient';

export const dynamic = 'force-dynamic';

export default async function DocumentosPage() {
  const [documents, employees] = await Promise.all([
    getDocuments(),
    getEmployees(),
  ]);
  return <DocumentosClient initialDocuments={documents} employees={employees} />;
}
