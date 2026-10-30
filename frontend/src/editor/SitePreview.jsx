// The website itself, shown in a browser-style frame.
// props.src: the page to show (e.g. /preview/ab12cd34/v1/index.html)
// props.width: 'desktop' or 'phone'
export default function SitePreview(props) {
  return (
    <div className={'ed-shell ed-preview is-' + props.width}>
      <div className="ed-core ed-preview-core">
        <div className="ed-chrome">
          <span className="ed-chrome-dots"><i /><i /><i /></span>
          <span className="ed-chrome-url">{props.label}</span>
        </div>
        <iframe key={props.src} title="Your website" src={props.src} className="ed-frame" />
      </div>
    </div>
  );
}
