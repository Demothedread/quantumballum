/**
 * UI module for the vertical wheel gear that launches balls.
 * Adds pointer interactions and sends force values to QuantumSim.
 */
(function(global){
  'use strict';
  const WheelGear = {
    _startY:0,
    _force:0,
    init(){
      const gear=document.getElementById('wheelGear');
      if(!gear) return;
      gear.addEventListener('pointerdown',e=>{
        this._startY=e.clientY;
        gear.setPointerCapture(e.pointerId);
      });
      gear.addEventListener('pointermove',e=>{
        if(!this._startY) return;
        const dy=Math.max(0,this._startY-e.clientY);
        this._force=Math.min(1,dy/100);
        gear.style.transform=`translateY(${-this._force*40}px)`;
      });
      gear.addEventListener('pointerup',e=>{
        gear.releasePointerCapture(e.pointerId);
        const f=this._force;
        this._startY=0;this._force=0;
        gear.style.transform='';
        global.QuantumSim?.mode?.pachinko?.launch(f);
      });
    }
  };
  document.addEventListener('DOMContentLoaded',()=>{
    WheelGear.init();
    const range=document.getElementById('nozzleRange');
    range?.addEventListener('input',e=>{
      const val=parseFloat(e.target.value);
      if(!isNaN(val) && global.QuantumSim) global.QuantumSim.state.params.nozzleAngle=val;
    });
  });
  global.WheelGear=WheelGear;
})(window);
