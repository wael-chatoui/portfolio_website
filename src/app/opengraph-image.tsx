import { ImageResponse } from 'next/og';

export const alt = 'Wael Chatoui, développeur freelance. Outils métier, CRM, SaaS et automatisation IA.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '80px', background: '#09090b', color: '#fafafa' }}>
      <div style={{ fontSize: 28, color: '#a1a1aa', marginBottom: 36 }}>Développeur freelance · Paris / Remote</div>
      <div style={{ fontSize: 88, fontWeight: 700, letterSpacing: '-4px' }}>Wael Chatoui</div>
      <div style={{ fontSize: 40, color: '#d4d4d8', marginTop: 34 }}>Outils métier. CRM. SaaS. Automatisation IA.</div>
      <div style={{ fontSize: 24, marginTop: 56, color: '#a1a1aa' }}>Un besoin concret, un périmètre clair, un outil livré.</div>
    </div>, size,
  );
}
