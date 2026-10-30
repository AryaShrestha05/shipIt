// The website itself, shown in a browser-style frame.
// props.src: the page to show (e.g. /preview/ab12cd34/v1/index.html)
// props.width: 'desktop' or 'phone'
// props.onLoad(doc): called with the page's document each time it loads,
//   so the picker can attach to it
export default function SitePreview(props) {
  return (
    <div className={'ed-shell ed-preview is-' + props.width}>
      <div className="ed-core ed-preview-core">
        <div className="ed-chrome">
          <span className="ed-chrome-dots"><i /><i /><i /></span>
          <span className="ed-chrome-url">{props.label}</span>
        </div>
        {/* An iframe is a page inside our page. key={props.src} makes React load a fresh one when the version changes. */}
        <iframe
          key={props.src}
          title="Your website"
          src={props.src}
          className="ed-frame"
          onLoad={function (e) { props.onLoad(e.target.contentDocument); }}
        />
      </div>
    </div>
  );
}
