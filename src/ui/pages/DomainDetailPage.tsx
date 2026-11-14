import React from 'react';
import { useParams, Link } from 'react-router-dom';

export function DomainDetailPage() {
  const { domainId } = useParams<{ domainId: string }>();

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="mb-4">
        <Link to="/" className="text-instrument text-sm font-medium hover:underline inline-flex items-center min-h-[44px]">
          ← Back to Today
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-ink capitalize">Domain: {domainId}</h1>
      <p className="text-ink-soft">Domain detail placeholder.</p>
    </div>
  );
}
