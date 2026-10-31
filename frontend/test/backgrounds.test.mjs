import test from 'node:test';
import assert from 'node:assert/strict';
import { backgroundStyle, backgroundCss } from '../src/blocks/studio/backgroundStyle.js';
import { normalizeStudioTheme, upsertTheme, saveThemeLibrary, readThemeLibrary } from '../src/blocks/studio/themeModel.js';
import { FONT_OPTIONS, normalizeCustomStyle } from '../src/blocks/customTheme.js';

test('all 20 font choices survive normalization', () => {
  assert.equal(FONT_OPTIONS.length,20);
  for(const font of FONT_OPTIONS) assert.equal(normalizeCustomStyle({ headingFont:font.id }).headingFont,font.id);
});
test('background values reject injected styles and clamp controls', () => {
  const t=normalizeStudioTheme({background:'pattern',pattern:'unsafe',gradientAngle:999,patternScale:-20,gradientFrom:'red;}',imageFit:'bad',overlayColor:'</style>'});
  assert.equal(t.pattern,'dots'); assert.equal(t.gradientAngle,360); assert.equal(t.patternScale,8);
  assert.equal(t.gradientFrom,'#ece0ff'); assert.equal(t.imageFit,'cover'); assert.equal(t.overlayColor,'#131620');
});
test('gradients honor colors, shape, stops and angle', () => {
  const value={background:'gradient',gradientType:'linear',gradientFrom:'#112233',gradientMiddle:'#445566',gradientTo:'#778899',gradientAngle:75,gradientStop:35};
  assert.equal(backgroundStyle(value).backgroundImage,'linear-gradient(75deg,#112233,#445566 35%,#778899)');
  assert.match(backgroundStyle({...value,gradientType:'conic'}).backgroundImage,/conic-gradient/);
  assert.equal(backgroundStyle({...value,gradientThree:false}).backgroundImage,'linear-gradient(75deg,#112233,#778899)');
});
test('patterns, textures and illustrated wallpapers produce distinct local backgrounds', () => {
  for(const [type,key,options] of [['pattern','pattern',['dots','grid','diagonal','checker','zigzag','rings']],['texture','texture',['paper','linen','grain','speckle']],['wallpaper','wallpaper',['dunes','mountains','botanical','cosmic']]]) {
    const styles=options.map(value=>backgroundStyle({background:type,[key]:value}).backgroundImage);
    assert.equal(new Set(styles).size,options.length);
    for(const style of styles) { assert.ok(style!=='none'); assert.ok(!/url\(["']?https?:/i.test(style)); assert.ok(!style.includes('undefined')); }
  }
});
test('upload backgrounds honor repeat, positioning, overlay and scope', () => {
  const image='data:image/png;base64,YWJj';
  const value={background:'image',image,imageFit:'tile',imageTileSize:120,imagePosition:'right top',overlayUseTheme:false,overlayColor:'#112233',overlay:40,backgroundScope:'page'};
  const style=backgroundStyle(value);
  assert.ok(style.backgroundImage.includes(image)); assert.ok(style.backgroundImage.includes('rgba(17,34,51,0.4)'));
  assert.equal(style.backgroundSize,'auto,120px auto'); assert.equal(style.backgroundPosition,'right top');
  assert.ok(backgroundCss(value).startsWith('body{'));
  assert.equal(backgroundStyle({background:'image',image:'javascript:alert(1)'}).backgroundImage,'none');
});
test('background settings persist when a custom theme is saved and reloaded', () => {
  let text;
  const storage={setItem:(key,value)=>{text=value;},getItem:()=>text};
  const library=upsertTheme({themes:[]},{id:'pattern',name:'My checkerboard',settings:{background:'pattern',pattern:'checker',patternScale:64,patternOpacity:35,headingFont:'caveat'}});
  saveThemeLibrary(storage,library);
  const restored=readThemeLibrary(storage).themes[0].settings;
  assert.equal(restored.pattern,'checker'); assert.equal(restored.patternScale,64); assert.equal(restored.headingFont,'caveat');
});
test('older saved gradients keep their palette-derived colors when opened', () => {
  const storage={getItem:()=>JSON.stringify({version:1,activeId:'old',themes:[{id:'old',name:'Old gradient',settings:{background:'gradient',light:{bg:'#000000',accent:'#ffffff'}}}]})};
  const theme=readThemeLibrary(storage).themes[0].settings;
  assert.equal(theme.gradientFrom,'#000000'); assert.equal(theme.gradientTo,'#383838'); assert.equal(theme.gradientThree,false);
  assert.equal(backgroundStyle(theme).backgroundImage,'linear-gradient(135deg,#000000,#383838)');
});
