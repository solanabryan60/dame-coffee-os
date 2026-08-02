type GoogleMapProps = {
  address: string;
  title: string;
  className?: string;
};

export default function GoogleMap({ address, title, className = '' }: GoogleMapProps) {
  const query = address.trim() || 'Southern California';
  const source = `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;

  return (
    <div className={`dame-map-frame ${className}`.trim()}>
      <iframe
        src={source}
        title={title}
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}
