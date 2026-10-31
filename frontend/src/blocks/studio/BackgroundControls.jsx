import { BACKGROUND_TYPES, GRADIENTS, PATTERNS, TEXTURES, WALLPAPERS } from './backgroundOptions';
import { backgroundStyle } from './backgroundStyle';

export default function BackgroundControls({ settings: t, onChange, onUpload, uploading }) {
  const set = (key,value) => onChange({ [key]: value });
  const base = t.backgroundUseTheme ? t[t.mode].bg : t.backgroundColor;
  const overlayColor = t.overlayUseTheme ? t[t.mode].bg : t.overlayColor;
  const isPicture = t.background === 'image' || t.background === 'wallpaper';
  const gradient = GRADIENTS.find(preset => t.gradientFrom === preset.gradientFrom && t.gradientMiddle === preset.gradientMiddle && t.gradientTo === preset.gradientTo);

  return <section className="studio-background-controls studio-simple-background" aria-label="Background settings">
    <Select label="Background" value={t.background} set={value => set('background',value)} options={BACKGROUND_TYPES.map(([id,name]) => [id,id === 'image' ? 'Upload a picture' : name])} />
    {t.background === 'gradient' && <Select label="Gradient style" value={gradient?.name || ''} set={name => { const preset=GRADIENTS.find(item => item.name === name); if(preset) onChange({ ...preset, gradientThree:true }); }} options={[["","Custom gradient"],...GRADIENTS.map(preset => [preset.name,preset.name])]} />}
    {t.background === 'pattern' && <Select label="Pattern" value={t.pattern} set={value => set('pattern',value)} options={PATTERNS} />}
    {t.background === 'texture' && <Select label="Texture" value={t.texture} set={value => set('texture',value)} options={TEXTURES} />}
    {t.background === 'wallpaper' && <Select label="Wallpaper" value={t.wallpaper} set={value => set('wallpaper',value)} options={WALLPAPERS} />}
    {t.background === 'image' && <div className="studio-simple-upload">
      <label htmlFor="studio-picture">{uploading ? 'Preparing picture…' : 'Choose a picture from your device'}<input id="studio-picture" type="file" accept="image/jpeg,image/png,image/webp" onChange={onUpload} /></label>
      <small>JPG, PNG or WebP · up to 10 MB</small>
      {t.image && <><p className="studio-image-name">{t.imageName || 'Your uploaded picture'}</p><button onClick={() => onChange({image:'',imageName:'',background:'solid'})}>Remove picture</button></>}
    </div>}
    {t.background !== 'solid' && (t.background !== 'image' || t.image) && <div className="studio-background-sample" role="img" aria-label="Selected background preview" style={{...backgroundStyle(t),backgroundAttachment:'scroll'}} />}
    {isPicture && <Range label="Fade picture for readable text" value={t.overlay} min={0} max={95} unit="%" set={value => set('overlay',value)} />}

    <details className="studio-background-details"><summary>Fine-tune background</summary>
      <Select label="Apply to" value={t.backgroundScope} set={value => set('backgroundScope',value)} options={[["hero","Hero section"],["page","Entire website"]]} />
      <Color label="Background color" value={base} set={value => onChange({backgroundColor:value,backgroundUseTheme:false})} />
      <label className="studio-bg-checkbox"><input type="checkbox" checked={t.backgroundUseTheme} onChange={event => set('backgroundUseTheme',event.target.checked)} />Use website background color</label>
      {t.background === 'gradient' && <>
        <Select label="Gradient shape" value={t.gradientType} set={value => set('gradientType',value)} options={[["linear","Linear"],["radial","Radial"],["conic","Conic swirl"]]} />
        <Color label="Start color" value={t.gradientFrom} set={value => set('gradientFrom',value)} />
        <Color label="End color" value={t.gradientTo} set={value => set('gradientTo',value)} />
        <label className="studio-bg-checkbox"><input type="checkbox" checked={t.gradientThree} onChange={event => set('gradientThree',event.target.checked)} />Add a middle color</label>
        {t.gradientThree && <><Color label="Middle color" value={t.gradientMiddle} set={value => set('gradientMiddle',value)} /><Range label="Middle stop" value={t.gradientStop} min={10} max={90} unit="%" set={value => set('gradientStop',value)} /></>}
        {t.gradientType !== 'radial' && <Range label="Gradient angle" value={t.gradientAngle} min={0} max={360} unit="°" set={value => set('gradientAngle',value)} />}
        {t.gradientType !== 'linear' && <Position value={t.imagePosition} set={value => set('imagePosition',value)} />}
      </>}
      {t.background === 'pattern' && <>
        <Color label="Pattern color" value={t.patternColor} set={value => set('patternColor',value)} />
        <Range label="Pattern size" value={t.patternScale} min={8} max={128} unit="px" set={value => set('patternScale',value)} />
        <Range label="Pattern strength" value={t.patternOpacity} min={5} max={100} unit="%" set={value => set('patternOpacity',value)} />
        {t.pattern === 'diagonal' && <Range label="Stripe angle" value={t.patternAngle} min={0} max={180} unit="°" set={value => set('patternAngle',value)} />}
      </>}
      {t.background === 'texture' && <>
        <Color label="Texture tint" value={t.patternColor} set={value => set('patternColor',value)} />
        <Range label="Texture scale" value={t.textureScale} min={8} max={80} unit="" set={value => set('textureScale',value)} />
        <Range label="Texture strength" value={t.textureOpacity} min={5} max={80} unit="%" set={value => set('textureOpacity',value)} />
      </>}
      {isPicture && <>
        <Select label="Image fit" value={t.imageFit} set={value => set('imageFit',value)} options={[["cover","Fill / crop to fit"],["contain","Show entire image"],["tile","Repeat as tiles"]]} />
        {t.imageFit === 'tile' && <Range label="Tile width" value={t.imageTileSize} min={40} max={600} unit="px" set={value => set('imageTileSize',value)} />}
        <Position value={t.imagePosition} set={value => set('imagePosition',value)} />
        <Color label="Overlay color" value={overlayColor} set={value => onChange({overlayColor:value,overlayUseTheme:false})} />
        <label className="studio-bg-checkbox"><input type="checkbox" checked={t.overlayUseTheme} onChange={event => set('overlayUseTheme',event.target.checked)} />Match overlay to website mode</label>
        <Select label="Background scrolling" value={t.backgroundAttachment} set={value => set('backgroundAttachment',value)} options={[["scroll","Scroll with the page"],["fixed","Stay fixed in the window"]]} />
      </>}
    </details>
  </section>;
}
function Color({label,value,set}) {
  return <label className="studio-bg-color"><span>{label}</span><span><input type="color" aria-label={label} value={value} onChange={event => set(event.target.value)} /><code>{value}</code></span></label>;
}
function Select({label,value,set,options}) {
  return <label className="studio-control"><span>{label}</span><select value={value} onChange={event => set(event.target.value)}>{options.map(([id,text]) => <option key={id} value={id}>{text}</option>)}</select></label>;
}
function Range({label,value,min,max,unit,set}) {
  return <label className="studio-control studio-slider"><span>{label}<output>{value}{unit}</output></span><input type="range" min={min} max={max} value={value} onChange={event => set(Number(event.target.value))} /></label>;
}
function Position({value,set}) {
  return <Select label="Picture position" value={value} set={set} options={[["center","Center"],["top","Top"],["bottom","Bottom"],["left","Left"],["right","Right"],["left top","Top left"],["right top","Top right"],["left bottom","Bottom left"],["right bottom","Bottom right"]]} />;
}
