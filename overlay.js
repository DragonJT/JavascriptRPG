import * as THREE from 'three';

function Element(scene, x, y, w, h){
    const canvas = document.createElement('canvas');
    var tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
    scene.add(quad);
    setPosition(x,y,w,h);
    const ctx = canvas.getContext('2d');

    function setPosition(x,y,w,h){
        canvas.width = w;
        canvas.height = h;
        quad.position.x = x + w/2;
        quad.position.y = innerHeight - (y + h/2);
        quad.scale.x = w;
        quad.scale.y = h;
    }

    function show(){
        quad.visible = true;
    }

    function hide(){
        quad.visible = false;
    }

    function refreshTex(){
        tex = new THREE.CanvasTexture(canvas);
        mat.map = tex;
        mat.needsUpdate = true;
    }
    return {setPosition, ctx, quad, show, hide, refreshTex};
}

export function createOverlay() {
    const uiCamera = new THREE.OrthographicCamera(0, innerWidth, innerHeight, 0, 0, 1);
    const scene = new THREE.Scene();
    var menu = undefined;

    function resize(){
        uiCamera.right = innerWidth;
        uiCamera.top = innerHeight;
        uiCamera.updateProjectionMatrix();
    }

    function createMenu(e, x, y, w, h, items, onclick){
        if(!menu){
            menu = Element(scene, x, y, w, h);
        }
        else{
            menu.setPosition(x, y, w, h);
        }
        function onevent(e){
            menu.ctx.fillStyle = 'rgba(20,25,32,0.95)';
            menu.ctx.fillRect(0, 0, w, h);
            const fontsize = 22;
            menu.ctx.font = fontsize+'px sans-serif';
            var py = 10;
            const lineHeight = 30;
            for(var item of items){
                if(e.clientX > x && e.clientY > y + py && e.clientX < x+w && e.clientY < y + py + lineHeight){
                    menu.ctx.fillStyle = 'red';
                    menu.ctx.fillRect(0, py, w, lineHeight);
                    if(e.type == 'pointerdown'){
                        onclick(item);
                        menu.hide();
                        e.used = true;
                    }
                }
                menu.ctx.fillStyle = 'white';
                menu.ctx.fillText(item, 20, py + fontsize);
                py += lineHeight;
            }
            menu.refreshTex();
        }
        menu.show();
        menu.onevent = onevent;
        onevent(e);
    }

    function onevent(e){
        if(menu && menu.quad.visible){
            menu.onevent(e);
        }  
    }

    function render(renderer){   
        renderer.render(scene, uiCamera);
    }

    return {resize, createMenu, render, onevent}
}