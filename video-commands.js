(function (root) {
  'use strict';
  const FPS = 24;
  function dimensions(quality) { return quality === '720' ? [1280, 720] : [640, 360]; }
  function validSeconds(value) {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 1 || n > 30) throw new Error('장면 길이는 1~30초로 정해 주세요.');
    return Math.round(n * FPS) / FPS;
  }
  function sceneArgs(index, scene, quality) {
    const seconds = validSeconds(scene.seconds), frames = Math.round(seconds * FPS);
    const [w, h] = dimensions(quality);
    const filters = [`scale=${w * 2}:${h * 2}`];
    const z = scene.zoom ? `1+0.12*on/${Math.max(1, frames - 1)}` : '1';
    filters.push(`zoompan=z='${z}':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d=1:s=${w}x${h}:fps=${FPS}`);
    const fade = Math.min(0.8, seconds / 3);
    if (scene.fadeIn) filters.push(`fade=t=in:st=0:d=${fade.toFixed(3)}`);
    if (scene.fadeOut) filters.push(`fade=t=out:st=${(seconds - fade).toFixed(3)}:d=${fade.toFixed(3)}`);
    filters.push('setsar=1', 'format=yuv420p');
    return ['-y', '-loop', '1', '-framerate', String(FPS), '-i', `photo${index}.jpg`,
      '-vf', filters.join(','), '-frames:v', String(frames), '-an', '-c:v', 'libx264',
      '-preset', 'ultrafast', '-crf', '23', '-pix_fmt', 'yuv420p', '-threads', '1', `part${index}.mp4`];
  }
  function finalArgs(scenes, volume) {
    const duration = scenes.reduce((sum, s) => sum + validSeconds(s.seconds), 0);
    const gain = Number(volume);
    if (!Number.isFinite(gain) || gain < 0 || gain > 1) throw new Error('음악 볼륨 값을 확인해 주세요.');
    const endFade = Math.min(1, duration / 3);
    return ['-y', '-f', 'concat', '-safe', '0', '-i', 'parts.txt',
      '-stream_loop', '-1', '-i', 'music.input', '-map', '0:v:0', '-map', '1:a:0',
      '-c:v', 'copy', '-c:a', 'aac', '-b:a', '128k',
      '-af', `volume=${gain},afade=t=out:st=${(duration - endFade).toFixed(3)}:d=${endFade.toFixed(3)}`,
      '-t', duration.toFixed(3), '-movflags', '+faststart', '-threads', '1', 'music-video.mp4'];
  }
  const api = {FPS, dimensions, validSeconds, sceneArgs, finalArgs};
  root.VideoCommands = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window === 'undefined' ? globalThis : window);
