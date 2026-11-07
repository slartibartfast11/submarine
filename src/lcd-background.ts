import Phaser from 'phaser';
import { COLOURS,PLAYER_DEPTHS,SCREEN } from './config';
/** Cache a static backdrop texture at twice the logical display resolution. */
export function drawLcdBackdrop(scene:Phaser.Scene):void{
 const key='lcd-backdrop-v032';
 if(!scene.textures.exists(key)){
  const tex=scene.textures.createCanvas(key,SCREEN.width*2,SCREEN.height*2);
  if(!tex)throw new Error('LCD backdrop unavailable');
  const c=tex.getContext();c.scale(2,2);
  c.fillStyle='#'+COLOURS.background.toString(16).padStart(6,'0');
  c.fillRect(0,0,SCREEN.width,SCREEN.height);
  c.strokeStyle='#879d88';c.lineWidth=2.8;c.globalAlpha=0.32;
  function cloud(x:number,y:number,w:number):void{
   c.beginPath();c.moveTo(x,y+10);
   c.bezierCurveTo(x+w*.04,y-2,x+w*.18,y-4,x+w*.26,y+4);
   c.bezierCurveTo(x+w*.32,y-17,x+w*.47,y-13,x+w*.55,y+1);
   c.bezierCurveTo(x+w*.67,y-9,x+w*.75,y-3,x+w*.8,y+5);
   c.bezierCurveTo(x+w*.9,y-4,x+w*.97,y+1,x+w,y+9);
   c.stroke();
  }
  cloud(28,150,178);cloud(343,204,222);cloud(726,157,200);
  c.globalAlpha=.13;c.lineWidth=1;
  for(const [x,y,w] of [[148,220,48],[580,140,52],[820,230,40]]){
   c.beginPath();c.moveTo(x-w,y+6);c.quadraticCurveTo(x-w/2,y-8,x,y+5);
   c.quadraticCurveTo(x+w/2,y-7,x+w,y+6);c.stroke();
  }
  c.globalAlpha=.88;c.strokeStyle='#26372d';c.lineWidth=2.25;
  c.beginPath();c.moveTo(0,SCREEN.waterline);
  for(let x=0;x<SCREEN.width;x+=32){
   c.quadraticCurveTo(x+16,SCREEN.waterline+(x%128===0?1:-.5),x+32,SCREEN.waterline);
  }c.stroke();
  c.globalAlpha=.15;c.strokeStyle='#879d88';c.lineWidth=.8;
  for(const y of PLAYER_DEPTHS){c.beginPath();c.moveTo(22,y+22);c.lineTo(SCREEN.width-22,y+22);c.stroke();}
  c.globalAlpha=.46;c.lineWidth=1.8;c.beginPath();c.moveTo(0,SCREEN.seafloor);
  c.quadraticCurveTo(250,SCREEN.seafloor+2,480,SCREEN.seafloor);
  c.quadraticCurveTo(740,SCREEN.seafloor-2,SCREEN.width,SCREEN.seafloor);c.stroke();
  c.globalAlpha=.23;
  for(const [x,w] of [[62,36],[234,22],[553,37],[814,25]]){
   c.beginPath();c.moveTo(x-w/2,SCREEN.seafloor);
   c.quadraticCurveTo(x-w/4,SCREEN.seafloor-10,x,SCREEN.seafloor-3);
   c.quadraticCurveTo(x+w/4,SCREEN.seafloor-12,x+w/2,SCREEN.seafloor);c.stroke();
  }
  c.globalAlpha=1;tex.refresh();
 }
 scene.add.image(SCREEN.width/2,SCREEN.height/2,key)
  .setDisplaySize(SCREEN.width,SCREEN.height).setDepth(-10);
}
