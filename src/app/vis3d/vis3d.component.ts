import { Component, OnInit, Input, ElementRef } from '@angular/core';
declare var THREE: any;
declare var $: any;
declare var createjs: any;
import * as d3 from 'd3';
import { DataService } from '../data.service';
import { FirebaseService } from '../firebase.service';
import { map, take } from 'rxjs/operators';

@Component({
  selector: 'app-vis3d',
  templateUrl: './vis3d.component.html',
  styleUrls: ['./vis3d.component.scss']
})
export class Vis3dComponent implements OnInit {

  notesSubscription;
  notesData;

  width = 800;
  height = 700;
  particleSystem;
  camera;
  scene;
  uniforms;
  shaderMaterial;
  fontloader;
  geometry;
  renderer;
  target_circles = [];
  dataSource = 0;

  constructor(private el: ElementRef, private data: DataService, private fs: FirebaseService) { }

  ngOnInit() {

    this.notesSubscription = this.fs
    .getAllNotes()
    .pipe(
      map(col =>
        col.map(d => {
          return {
            noteId: d.payload.doc.id,
            ...d.payload.doc.data()
          };
        })
      )
    )
    .subscribe(data => {

      this.processNotes(data);

    });

    this.width = document.getElementById('canvas3d').clientWidth;
    this.height = document.getElementById('canvas3d').clientHeight - 150;
    this.data.getHeart(null);
    this.data.heartRecieved.subscribe(d => {
      console.log('data recieved ', d);
      this.init();

    });

    window.setInterval(d => {
      console.log('hello');
      const r = Math.round(Math.random() * 4);
      if (r <= 2) { this.data.posData_model(this.dataSource); }
       else if (r === 3) { this.data.posData_random(this.dataSource); }
       else if ( r === 4) { this.data.posData_control(this.dataSource); }
    }, 42000);

  }

  public onDeleteNote(noteId) {
    this.fs.deleteNoteById(noteId);
  }

  processNotes(data) {
    let linelength = 6;
    console.log(data);
    data.forEach((d, i) => {
      const tgt = {idx: Math.round(Math.random() * 12000), msg: data[i]['contents'], id: data[i]['noteId']};
      const msgArr = data[i]['contents'].replace(/(\r\n|\n|\r)/gm," ").split(' ');
      console.log(msgArr)
      let msgArrSplit = [];
      if (msgArr.length > linelength - 1) {
        for(let i = 0; i < 20; i++) {
          if (msgArr.length > linelength - 1) {
            msgArrSplit.push(msgArr.splice(0, linelength))
          }
        };
      } else {
        msgArrSplit.push(msgArr);
      }
      msgArrSplit.forEach(s => { s = s.join(' ') });
      tgt.msg = msgArrSplit;
      console.log(msgArrSplit);
      if ( !this.data.targets.find(f => f.msg === tgt.msg) && i < 20 ) {
        this.data.targets.push(tgt);
        this.target(tgt);
      }
    });

    this.data.targets.forEach((t, i) => {
      if (!data.find(f => f.contents === t.msg)) {
        console.log(t);
        this.data.targets.splice(i, 1);
        this.removeTarget(t);
      }
    });
  }

  init() {
    const self = this;
    this.fontloader = new THREE.FontLoader();
    // d3.select(this.el.nativeElement).html('');
    this.camera = new THREE.PerspectiveCamera( 40, this.width / this.height, 0.001, 10000 );
    this.camera.position.z = 2000;
    this.scene = new THREE.Scene();
    this.uniforms = {
      texture:   { value: new THREE.TextureLoader().load( '../assets/img/particle.png' ) }
    };
    this.shaderMaterial = new THREE.ShaderMaterial( {
      uniforms:       this.uniforms,
      vertexShader:   document.getElementById( 'vertexshader' ).textContent,
      fragmentShader: document.getElementById( 'fragmentshader' ).textContent,
      blending:       THREE.AdditiveBlending,
      depthTest:      false,
      transparent:    true,
      vertexColors:   true
    });
    this.geometry = new THREE.BufferGeometry();

    // ADD ATTR FOR SHADER
    this.geometry.addAttribute( 'position', new THREE.Float32BufferAttribute( this.data.get_pos_from_data(this.dataSource), 3 ) );
    this.geometry.addAttribute( 'color', new THREE.Float32BufferAttribute( this.data.get_color_from_data(this.dataSource), 3 ) );
    // tslint:disable-next-line:max-line-length
    this.geometry.addAttribute( 'size', new THREE.Float32BufferAttribute( this.data.get_size_from_data(this.dataSource), 1 ).setDynamic( true ) );

    this.particleSystem = new THREE.Points( this.geometry, this.shaderMaterial );
    this.scene.add( this.particleSystem );

    this.renderer = new THREE.WebGLRenderer({alpha: true, antialias: true});
    this.renderer.setPixelRatio( window.devicePixelRatio );
    this.renderer.setSize( this.width, this.height );
    const container = document.getElementById('canvas3d');
    container.appendChild( this.renderer.domElement );

    // ADD CONTROLS
    const controls = new THREE.FlyControls( this.camera );
    controls.movementSpeed = 1000;
    controls.domElement = this.renderer.domElement;
    controls.rollSpeed = Math.PI / 6;
    controls.autoForward = false;
    controls.dragToLook = false;

    // ANIMATE AND RENDER
    function animate() {
      requestAnimationFrame( animate );
      render();
    }
    const clock = new THREE.Clock();
    console.log(this.dataSource);
    function render() {
      const delta = clock.getDelta();
      const time = Date.now() * 0.005;

      if (self.data.modules[self.dataSource].rot_speed === 0) {
        self.particleSystem.rotation.y = 0;
        // console.log(self.dataSource)
      } else {
        self.particleSystem.rotation.y += self.data.modules[self.dataSource].rot_speed;
      }
      const sizes = self.geometry.attributes.size.array;
      const poss = self.geometry.attributes.position.array;
      const colors = self.geometry.attributes.color.array;
      for ( let i = 0, j = 0; i < self.data.modules[self.dataSource].data.length; i++, j += 3 ) {
        // sizes[ i ] = 10 * ( 1 + Math.sin( 0.1 * i + time ) );
        poss[j] = self.data.modules[self.dataSource].data[i].pos[0];
        poss[j + 1] = self.data.modules[self.dataSource].data[i].pos[1];
        poss[j + 2] = self.data.modules[self.dataSource].data[i].pos[2];

        colors[j] = self.data.modules[self.dataSource].data[i].color[0];
        colors[j + 1] = self.data.modules[self.dataSource].data[i].color[1];
        colors[j + 2] = self.data.modules[self.dataSource].data[i].color[2];

      }
      self.geometry.attributes.size.needsUpdate = true;
      self.geometry.attributes.position.needsUpdate = true;
      self.geometry.attributes.color.needsUpdate = true;
      if (self.target_circles.length === self.data.targets.length) {
        self.data.targets.forEach((f, i) => {
          const trg = self.data.modules[self.dataSource].data[f.idx].pos;
          self.target_circles[i].circle.position.x = trg[0];
          self.target_circles[i].circle.position.y = trg[1];
          self.target_circles[i].circle.position.z = trg[2];
          self.target_circles[i].line.geometry.vertices[0].x = trg[0];
          self.target_circles[i].line.geometry.vertices[0].y = trg[1];
          self.target_circles[i].line.geometry.vertices[0].z = trg[2];

          // tslint:disable:max-line-length
          const endTarget = {
            x: trg[0] < 0 ? trg[0] - (self.particleSystem.geometry.boundingSphere.radius / 8) : trg[0] + (self.particleSystem.geometry.boundingSphere.radius / 8),
            y: trg[1] < 0 ? trg[1] - (self.particleSystem.geometry.boundingSphere.radius * ((trg[1] / 1500) * -1)) : trg[1] + (self.particleSystem.geometry.boundingSphere.radius * (trg[1] / 1500)),
            z: trg[2] < 0 ? trg[2] - (self.particleSystem.geometry.boundingSphere.radius / 8) : trg[2] + (self.particleSystem.geometry.boundingSphere.radius / 8),
          };
          self.target_circles[i].line.geometry.vertices[1].x = self.target_circles[i].line.geometry.vertices[1].x - ((self.target_circles[i].line.geometry.vertices[1].x - endTarget.x) / 22);
          self.target_circles[i].line.geometry.vertices[1].y = self.target_circles[i].line.geometry.vertices[1].y - ((self.target_circles[i].line.geometry.vertices[1].y - endTarget.y) / 22);
          self.target_circles[i].line.geometry.vertices[1].z = self.target_circles[i].line.geometry.vertices[1].z - ((self.target_circles[i].line.geometry.vertices[1].z - endTarget.z) / 22);
          self.target_circles[i].line.geometry.verticesNeedUpdate = true;
          self.target_circles[i].text.position.x = self.target_circles[i].text.position.x - ((self.target_circles[i].text.position.x - endTarget.x) / 22);
          self.target_circles[i].text.position.y = self.target_circles[i].text.position.y - ((self.target_circles[i].text.position.y - endTarget.y) / 22);
          self.target_circles[i].text.position.z = self.target_circles[i].text.position.z - ((self.target_circles[i].text.position.z - endTarget.z) / 22);
          self.target_circles[i].text.rotation.y = -self.particleSystem.rotation.y;

        });

      }
      controls.update( delta );

      self.renderer.render( self.scene, self.camera );

    }
    animate();

    this.data.modules[this.dataSource].node_layout.call(this.data, this.dataSource);
    this.data.targets.forEach(t => {
      this.target(t);
    });
    console.log(this.particleSystem);

  }

  resize(w, h) {
    this.width = w;
    this.height = h;

    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize( this.width, this.height );

}

removeTarget(t) {
  console.log(t);
  const selectedObject_l = this.scene.getObjectByName('line_' + t.id);
  this.particleSystem.remove( selectedObject_l );
  const selectedObject_c = this.scene.getObjectByName('circle_' + t.id);
  this.particleSystem.remove( selectedObject_c );
  const selectedObject_t = this.scene.getObjectByName('text_' + t.id);
  this.particleSystem.remove( selectedObject_t );
}

target(t) {
  // circle
  const self = this;
  const trg = self.data.modules[self.dataSource].data[t.idx].pos;
  const segmentCount = 16,
      radius = 8,
      cirlce_geometry = new THREE.Geometry(),
      cirlce_material = new THREE.LineBasicMaterial({ color: 0xe74c3c });

  for (let i = 0; i <= segmentCount; i++) {
      const theta = (i / segmentCount) * Math.PI * 2;
      cirlce_geometry.vertices.push(
          new THREE.Vector3(
              Math.cos(theta) * radius,
              Math.sin(theta) * radius,
              0));
  }

  // line
  const line_material = new THREE.LineBasicMaterial({color: 0xe74c3c});

  const line_geometry = new THREE.Geometry();
  line_geometry.vertices.push(
    new THREE.Vector3( 0, 0, 0 ),
    new THREE.Vector3( 1000, 0, 0 )
  );

  // text3d
    this.fontloader.load( '../../assets/fonts/SourceCodeProMedium_Regular.json', ( font ) => {
      let txtGrp = new THREE.Group();
      console.log(t)
      t.msg.forEach((m, i) => {
  
        const txt = new THREE.TextGeometry( m, {
          font: font,
          size: 16,
          height: 2,
          curveSegments: 12,
          bevelEnabled: false,
        } );

        const txtmaterials = new THREE.MeshBasicMaterial({color: 0xe74c3c});
        const textMesh = new THREE.Mesh( txt, txtmaterials );
        textMesh.position.y = (t.msg.length - 1- i) * 18;
        txtGrp.add(textMesh);
      })

  // obj
  const target_obj = {
    line: new THREE.Line( line_geometry, line_material ),
    circle: new THREE.Line(cirlce_geometry, cirlce_material),
    text: txtGrp,
    id: t.id
  };

  target_obj.line.name = 'line_' + t.id;
  target_obj.circle.name = 'circle_' + t.id;
  target_obj.text.name = 'text_' + t.id;


  // text
  // const text = this._createTextLabel();
  // text.setHTML(t.msg);
  // text.setParent(target_obj.line.geometry.vertices[1]);
  // target_obj.text = text;
  // document.getElementById('canvas3d').appendChild(text.element);

  target_obj.circle.position.x = trg[0];
  target_obj.circle.position.y = trg[1];
  target_obj.circle.position.z = trg[2];

  target_obj.text.position.x = trg[0];
  target_obj.text.position.y = trg[1];
  target_obj.text.position.z = trg[2];
  target_obj.text.scale.set(0.0001, 0.0001, 0.0001);
  window.setInterval(d => { target_obj.text.scale.set(1, 1, 1); }, 2000);

  target_obj.line.geometry.vertices[0].x = trg[0];
  target_obj.line.geometry.vertices[0].x = trg[1];
  target_obj.line.geometry.vertices[0].x = trg[2];

  target_obj.line.geometry.vertices[1].x = trg[0];
  target_obj.line.geometry.vertices[1].x = trg[1];
  target_obj.line.geometry.vertices[1].x = trg[2];

  this.target_circles.push(target_obj);
  this.particleSystem.add(target_obj.circle);
  this.particleSystem.add(target_obj.line);
  this.particleSystem.add(target_obj.text);

} );


  // this.scene.add(this.target_circle);
}

_createTextLabel() {
  const self = this;
  const div = document.createElement('div');
  div.className = 'text-label';
  div.style.position = 'absolute';
  div.innerHTML = 'Anomaly';
  div.style.top = '100px';
  div.style.left = '100px';
  div.style.color = '#e74c3c';
  div.style.textAlign = 'center';
  div.style.transform = 'translate(0px,-7px)';

  const _this = this;

  return {
    element: div,
    parent: false,
    position: new THREE.Vector3(0, 0, 0),
    setHTML: function(html) {
      this.element.innerHTML = html;
    },
    setParent: function(threejsobj) {
      this.parent = threejsobj;
      console.log(threejsobj);
    },
    updatePosition: function() {
      if (parent) {
        this.position.copy(this.parent);
      }

      const coords2d = this.get2DCoords(this.position, self.camera);
      console.log(this.position);
      console.log( self.particleSystem.getWorldPosition(this.position) );
      // tslint:disable-next-line:max-line-length
      this.element.style.left = coords2d.x < document.getElementById('canvas3d').offsetWidth / 2 ? (coords2d.x - this.element.offsetWidth + 'px') : (coords2d.x + 'px');
      this.element.style.top = (coords2d.y + 'px');
    },
    get2DCoords: function(position, camera) {
      const vector = position.project(camera);
      const widthHalf = 0.5 * self.renderer.context.canvas.width;
      const heightHalf = 0.5 * self.renderer.context.canvas.height;
      vector.x = (vector.x * widthHalf) + widthHalf;
      vector.y = -(vector.y * heightHalf) + heightHalf;
      return vector;
    }
  };
}




}
