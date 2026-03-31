import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Footer from '../components/footer';
import Navbar from '../components/navbar';
import ScrollToTop from '../components/scrollToTop';
import ChatWidget from '../chatbot/ChatWidget';
import StandaloneTransportV2Page from './StandaloneTransportV2Page';

export default function DevTransportV2Page() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const initialCertificationId = queryParams.get('certificationId') || '';
  const [draftCertificationId, setDraftCertificationId] = useState(initialCertificationId);

  const openCertification = (event) => {
    event.preventDefault();
    const nextCertificationId = draftCertificationId.trim();
    const nextQuery = nextCertificationId ? `?certificationId=${encodeURIComponent(nextCertificationId)}` : '';
    navigate(`/dev/transport-v2${nextQuery}`, { replace: true });
  };

  return (
    <>
      <ScrollToTop />
      <Navbar />
      <main className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">Transport V2 Standalone</h1>
              <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-900">
                Dev wrapper
              </span>
            </div>

            <p className="mt-2 text-sm text-slate-600">
              Wrapper temporaneo per provare la nuova pagina standalone senza agganciarla al route
              reale dell&apos;app.
            </p>

            <form className="mt-4 flex flex-col gap-3 sm:flex-row" onSubmit={openCertification}>
              <input
                type="text"
                value={draftCertificationId}
                onChange={(event) => setDraftCertificationId(event.target.value)}
                placeholder="Certification ID"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 sm:max-w-xs"
              />
              <button
                type="submit"
                className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Apri bozza
              </button>
            </form>
          </section>

          <StandaloneTransportV2Page
            certificationId={initialCertificationId || null}
            onUnauthorized={() => navigate('/login')}
          />
        </div>
      </main>
      <Footer />
      <ChatWidget questionnaireType="transport" certificationId={initialCertificationId || null} />
    </>
  );
}
