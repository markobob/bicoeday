import { Injectable } from '@angular/core';
import * as d3 from 'd3';
import { Subject } from 'rxjs';
declare var THREE: any;
declare var createjs: any;

@Injectable({
  providedIn: 'root'
})
export class DataService {

  model_heart;
  scale = 400;
  heartRecieved;

  constructor() {

    this.heartRecieved = new Subject();

    this.modules[0].data = this.modules[0].gen_data.call(this, this.modules[0].data_size);
  }

  targets = [
  ];

  modules = [
    {data: null,
      dataRecieved: null,
      rot_speed: 0.0009,
      size: [350, 300],
      node_layout: this.posData_model,
      gen_data: this.genPseudoData,
      data_size: 12000,
      particle_size: 30},
  ];

  getHeart(ds) {
    d3.json('../assets/models/heart.json').then(d => {
      this.model_heart = d.data.attributes.position.array;
      for (let i = 0; i < this.model_heart.length; i++) {
        this.model_heart[i] *= this.scale;
      }

      this.heartRecieved.next(this.model_heart);

    });
  }

  posData_model(ds) {
    let a = 0;
    let b = 0;
    const c = this.model_heart.length / 3;
    this.modules[ds].data.forEach((d, i) => {
      if ( Number.isInteger(i / c) ) {b = i / c; }
      a = (i - (b * c)) * 3;
      createjs.Tween.get(d.pos).to([
        this.model_heart[a],
        this.model_heart[(a) + 1],
        this.model_heart[(a) + 2]
      ], 2500, createjs.Ease.cubicOut);
    });
    this.modules[ds].rot_speed = 0.0009;
  }

  posData_random(ds) {
    this.modules[ds].data.forEach(d => {
      createjs.Tween.get(d.pos).to([
        Math.random() * 1000 - 500,
        Math.random() * 1000 - 500,
        Math.random() * 1000 - 500
      ], 2500, createjs.Ease.cubicOut);
    });
    this.modules[ds].rot_speed = 0.002;
  }

  posData_control(ds) {
    const x = d3.scaleTime().domain(d3.extent(this.modules[ds].data, d => d.date)).range([-900, 900]);
    const y = d3.scaleLinear().domain(d3.extent(this.modules[ds].data, d => d.m1)).range([-300, 500]);
    this.modules[ds].data.forEach(d => {
      createjs.Tween.get(d.pos).to([
        x(d.date),
        y(d.m1),
        0
      ], 2500, createjs.Ease.cubicOut);
    });
    this.modules[ds].rot_speed = 0;
  }

  posData_dist(ds) {
    const scale = d3.scaleLinear().domain(d3.extent(this.modules[ds].data, d => d.m1)).range([-900, 1000]);
    this.modules[ds].data.forEach(d => {
      createjs.Tween.get(d.pos).to([
        scale(d.m1),
        Math.random() * 1000 - 500,
        0
      ], 2500, createjs.Ease.cubicOut);
    });
    this.modules[ds].rot_speed = 0;
  }

  posData_cluster(ds) {
    const cluster_list = ['A', 'B', 'C', 'D', 'E'];
    const clusters = {};

    function randomSpherePoint(x0, y0, z0, rad, rr= true) {
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.cos(2 * v - 1);
      const radius = rr ? Math.floor(Math.random() * rad) : rad;
      const x = x0 + (radius * Math.sin(phi) * Math.cos(theta));
      const y = y0 + (radius * Math.sin(phi) * Math.sin(theta));
      const z = z0 + (radius * Math.cos(phi) );
      return [x, y, z];
    }
    this.modules[ds].rot_speed = 0.003;
  }

  genPseudoDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  }

  genPseudoData(s) {
    const color = new THREE.Color();
    color.setHSL( 0.5, 0.8, 0.5 );
    const data = [];

    for (let i = 0; i < s; i++) {
      const obj = {ref: null, m1: null, date: null, pos: null, color: null};
      obj.ref = i;
      obj.m1 = Math.pow(d3.randomLogNormal(0, 1)() * 100, 0.5);
      obj.date = this.genPseudoDate(new Date(2016, 1, 1), new Date(2018, 5, 1));
      obj.pos = [Math.random() * 1000 - 500, Math.random() * 1000 - 500, Math.random() * 1000 - 500];
      obj.color = [color.r, color.g, color.b];
      data.push(obj);
    }
    return data;
  }

  get_pos_from_data(ds) {
    let pos = [];
    this.modules[ds].data.forEach(d => {
     pos = pos.concat(d.pos);
    });
    return pos;
  }

  get_color_from_data(ds) {
    const color = new THREE.Color();
    const q95 = d3.quantile(this.modules[ds].data.sort((a, b) => d3.ascending(a.m1, b.m1)), 0.95, d => d.m1);
    const q5 = d3.quantile(this.modules[ds].data.sort((a, b) => d3.ascending(a.m1, b.m1)), 0.05, d => d.m1);

    const colors = [];
    this.modules[ds].data.forEach(d => {
      if (d.m1 > q95) {color.setHSL( 284, 0.51, 0.8 ); } else if (d.m1 < q5) {color.set( 'white' ); } else {color.setHSL( 0.5, 0.8, 0.5 ); }
      colors.push(color.r, color.g, color.b);
      d.color = [color.r, color.g, color.b];
    });
    return colors;
  }

  get_size_from_data(ds) {
    const size = [];
    this.modules[ds].data.forEach(d => {
      size.push(this.modules[ds].particle_size);
    });
    return size;
  }

}
