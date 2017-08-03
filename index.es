import React, {Component} from 'react'
import {connect} from 'react-redux'
import {createSelector} from 'reselect'

import {store} from 'views/create-store'

import {join} from 'path'
import {FormGroup, FormControl, ListGroup, ListGroupItem, Button, Row, Col,OverlayTrigger,Tooltip} from 'react-bootstrap'
import FontAwesome from 'react-fontawesome'


import {extensionSelectorFactory} from 'views/utils/selectors'
const fs = require('fs')
const zh = "阿八嚓哒妸发旮哈或讥咔垃麻拏噢妑七呥撒它拖脱穵夕丫帀坐".split('');


export const reactClass = connect(
  state => ({
    horizontal: state.config.poi.layout || 'horizontal',
    $ships: state.const.$ships,
    ships: state.info.ships,
    $shipTypes: state.const.$shipTypes
  }),
  null, null, {pure: false}
)(class PluginNotify extends Component {

  constructor(props) {
    super(props)
    this.state = {
      notify_list: {newShip: true},
      need_load: true,
      notifyed:{},
      ship_targets: this.simplfyship(),
      show_shipList: false,
      input_shipList: ''
    }
  }

  componentWillReceiveProps(nextProps) {

  }


  componentDidMount = () => {
    window.addEventListener('game.response', this.handleResponse);
    this.loadlist();
  };

  componentWillUnmount = () => {
    window.removeEventListener('game.response', this.handleResponse)
  };

  handleResponse = e => {
    const {path, body} = e.detail;
    if (path == "/kcsapi/api_port/port") {
      this.get_all_unlocked_ship();
    }
  };

  get_all_unlocked_ship(){
    let allships = this.props.ships;
    let $ships = this.props.$ships;
    let notifylist = this.state.notify_list;
    let notifyed = this.state.notifyed;
    var notifys = [];
    for(var p in allships){
      var willnotify=false;
      var locked = allships[p].api_locked;
      var newshipid = allships[p].api_ship_id;
      var shipid = allships[p].api_id;
      if(locked==0){
        if(!notifyed[shipid]){
          if (notifylist.newShip) {
            if(notifylist[newshipid]!=2){
              if (this.if_new_ship(shipid,newshipid)) {
                willnotify=true;
              }
            }
          }
          if (notifylist[newshipid]==1) {
            willnotify=true;
          }
        }
      }
      if(willnotify){
        var shipname = $ships[newshipid].api_name;
        notifyed[shipid]=1;
        notifys.push(shipname);
      }
    }
    if(notifys.length>0){
      var notifystr = notifys.join('&');
      window.toggleModal('锁船提醒', notifystr + ':快给老娘上锁！');
      window.toast(notifystr + ':快给老娘上锁！');
      this.setState({notifyed:notifyed});
    }
  }

  if_new_ship(shipid,newshipid) {
    let allships = this.props.ships;
    let $ships = this.props.$ships;
    let shipidlist = {};
    let x = newshipid;
    shipidlist[x] = 1;
    while ($ships[x].api_aftershipid != "0") {
      let aftershipid = $ships[x].api_aftershipid;
      if (shipidlist[aftershipid] == undefined) {
        shipidlist[aftershipid] = 1;
        x = parseInt($ships[x].api_aftershipid);
      } else {
        break;
      }
    }
    for (let p in allships) {
      let ship = allships[p];
      let id = ship.api_id;
      if(id!=shipid){
        let shipid = ship.api_ship_id;
        if (shipidlist[shipid]) {
          return false;
        }
      }
    }
    return true;
  }

  handleFormChange(e) {
    let value = e.currentTarget.value;
    let notify_list = this.state.notify_list;
    if (notify_list[value] == undefined) {
      notify_list[value] = 1;
      this.setState({notify_list: notify_list},()=>this.savelist())
    }
  }

  removenotify(shipid) {
    let notify_list = this.state.notify_list;
    if (notify_list[shipid]) {
      delete(notify_list[shipid]);
      this.setState({notify_list: notify_list},()=>this.savelist())
    }
  }

  savelist() {
    try {
      let notifylist = this.state.notify_list;
      let savepath = join(window.APPDATA_PATH, 'notify_config', 'notify_config.json');
      fs.writeFileSync(savepath, JSON.stringify(notifylist));
      window.success("保存列表成功");
    } catch (e) {
      fs.mkdir(join(window.APPDATA_PATH, 'notify_config'));
      try {
        let notifylist = this.state.notify_list;
        let savepath = join(window.APPDATA_PATH, 'notify_config', 'notify_config.json');
        fs.writeFileSync(savepath, JSON.stringify(notifylist));
        window.success("保存列表成功");
      } catch (e2) {
        window.success("保存列表失败");
        console.log(e2);
      }
    }
  }

  loadlist() {
    let needload = this.state.need_load;
    if (needload) {
      try {
        let savedpath = join(window.APPDATA_PATH, 'notify_config', 'notify_config.json');
        let datastr = fs.readFileSync(savedpath, 'utf-8');
        let notifylist = eval("(" + datastr + ")");
        if (notifylist.n) {
          delete(notifylist.n);
          notifylist.newShip = true;
        }
        this.setState({notify_list: notifylist, need_load: false});
        return notifylist;
      } catch (e) {
        console.log(e);
        this.setState({notify_list: {newShip: true}, need_load: false});
        return {newShip: true};
      }
    } else {
      return this.state.notify_list;
    }
  }

  simplfyship() {
    try {
      return this.simplfyship_D();
    } catch (e) {
      console.log(e);
      try {
        return Object.keys(this.props.$ships);
      } catch (e2) {
        console.log(e2);
        return [];
      }
    }

  }

  simplfyship_D() {
    let $ships = this.props.$ships;
    for (let p in $ships) {
      let ship = $ships[p];
      let afterlv = ship.api_afterlv;
      let aftershipid = ship.api_aftershipid;
      if (afterlv && aftershipid) {
        let aftership = $ships[aftershipid];
        let aftership_beforeshipid = aftership.before_shipid;
        let aftership_beforeshiplv = aftership.before_shiplv;
        if (aftership_beforeshipid) {
          if (afterlv < aftership_beforeshiplv) {
            aftership.before_shipid = p;
            aftership.before_shiplv = afterlv;
          }
        } else {
          aftership.before_shipid = p;
          aftership.before_shiplv = afterlv;
        }
      }
    }
    let list = [];
    for (let p in $ships) {
      let ship = $ships[p];
      let afterlv = ship.api_afterlv;
      let aftershipid = ship.api_aftershipid;
      if (afterlv && aftershipid) {
        if (ship.before_shipid == undefined) {
          list.push(p);
        }
      }
    }
    list.sort(function (a, b) {
      return 8 * ($ships[a].api_stype - $ships[b].api_stype) + $ships[a].api_name.localeCompare($ships[b].api_name)
    });
    return list;
  }

  hiddenShipList = e => {
    e.preventDefault();
    e.stopPropagation();
    this.setState({show_shipList: false});
  };

  showShipList = e => {
    e.preventDefault();
    e.stopPropagation();
    this.setState({show_shipList: true, input_shipList: ''}, this.changeHandler(e, true));
  };

  changeHandler = (e, ...other) => {
    e.preventDefault();
    e.stopPropagation();
    let allship = [], $ship = this.props.$ships, expStr = e.target.value;
    if (other.length == 1 && other[0]) {
      expStr = ''
    }
    let lowstr = expStr.toLowerCase();
    this.simplfyship().map((id) => {
      var shipname = $ship[id].api_name;
      if(lowstr>='a'&&lowstr<='z'){
        var match=true;
        for(var i=0;i<lowstr.length;i++){
          var x=lowstr.charCodeAt(i)-97;
          var cs=zh[x];
          var ce=zh[x+1];
          if(shipname.charAt(i).localeCompare(cs)>0&&shipname.charAt(i).localeCompare(ce)<0){

          }else{
            match=false;
            break;
          }
        }
        if(match){
          allship.push(id);
        }
      }
      if (new RegExp(expStr, 'i').test($ship[id].api_name))
        allship.push(id);
    });
    this.setState({ship_targets: allship, input_shipList: e.target.value})
  };

  selectShip = e => {
    e.stopPropagation();
    let $ships = this.props.$ships, option = e.currentTarget.value;
    if (option != 0) {
      this.setState({input_shipList: $ships[option].api_name});
    }
    this.handleFormChange(e);
  };

  handleNewShip = e => {
    e.preventDefault();
    e.stopPropagation();
    let nl = this.state.notify_list;
    if (nl.newShip != 'undefined') {
      nl.newShip = !nl.newShip;
    } else {
      nl.newShip = true
    }
    this.setState({notify_list: nl},()=>this.savelist())
  };

  changeNotify(notifyKey){
    let nl = this.state.notify_list;
    if(nl[notifyKey]==1){
      nl[notifyKey]=2;
    }else{
      nl[notifyKey]=1;
    }
    this.setState({notify_list: nl},()=>this.savelist());
  }

  render() {
    try {
      return this.render_D();
    } catch (e) {
      console.log(e);
      return (
        <div>
          unknown error
        </div>
      )
    }
  }

  render_D() {
    const {$ships, horizontal} = this.props;
    const colSm = (horizontal == 'horizontal') ? 4 : 3,
      colMd = (horizontal == 'horizontal') ? 4 : 2;
    const notifylist = this.state.notify_list;
    const notifykeys = Object.keys(notifylist);
    try {
      notifykeys.sort(function (a, b) {
        if (a == "newShip") {
          return -999
        }
        if (b == "newShip") {
          return 999
        }
        return $ships[a].api_stype - $ships[b].api_stype
      })
    } catch (e) {
      console.log(e);
    }
    const $shipTypes = this.props.$shipTypes;

    const createList = arr => {
      let out = [];
      arr.map((option) => {
        const shipinfo = $ships[option],
          shipname = shipinfo.api_name,
          shiptypeid = shipinfo.api_stype,
          shiptypename = $shipTypes[shiptypeid].api_name;
        out.push(
          <li onMouseDown={this.selectShip} value={option}>
            <a>
              {shiptypename + ' : ' + shipname}
            </a>
          </li>
        )
      });
      return out;
    };

    return (
      <div id="notify" className="notify">
        <link rel="stylesheet" href={join(__dirname, 'notify.css')}/>
        <Row>
          <Col xs={12}>
            <form className="input-select">
              <FormGroup>
                <FormControl type="text" placeholder="输入要提醒的舰船" ref="shipInput" value={this.state.input_shipList}
                             onChange={this.changeHandler} onFocus={this.showShipList}
                             onBlur={this.hiddenShipList}/>
              </FormGroup>
              <ul className="ship-list dropdown-menu" style={{display: this.state.show_shipList ? 'block' : 'none'}}>
                {createList(this.state.ship_targets)}
              </ul>
            </form>
          </Col>
        </Row>
        <Row>
          <Col xs={12}>
            <Button bsSize="small" onClick={this.handleNewShip}
                    bsStyle={this.state.notify_list.newShip ? "success" : "danger"} style={{width: '100%'}}>
              <FontAwesome name={this.state.notify_list.newShip ? 'heart' : 'heartbeat'}/>
              &nbsp;船舱里没有的新船
            </Button>
          </Col>
        </Row>
        <Row>
          {notifykeys.map(function (notifykey) {
            if (notifykey != "newShip") {
              var notifyvalue = notifylist[notifykey];
              var color = 'ship-item btn-' + (notifyvalue == 1 ? 'success' : 'default');
              return (

                <OverlayTrigger placement={'top'} overlay={
                  <Tooltip>
                    <Button bsStyle="success" bsSize="xsmall" block><FontAwesome name="check" style={{marginRight: '10px'}}/>提醒此船</Button>
                    <Button bsStyle="default" bsSize="xsmall" block><FontAwesome name="close" style={{marginRight: '10px'}}/>不提醒此船</Button>
                    <small>点击可切换状态</small>
                  </Tooltip>
                }>
                  <Col xs={4} sm={colSm} md={colMd}>
                    <div className={color}>
                      <span className="ship-name" onClick={() => {this.changeNotify(notifykey)}}>
                         {notifyvalue == 1 ? <FontAwesome name="check" style={{marginRight: '10px'}}/> : <FontAwesome name="close" style={{marginRight: '10px'}}/>}{$ships[notifykey].api_name}
                      </span>
                      <span onClick={() => {this.removenotify(notifykey)}} className="close-btn"> </span>
                    </div>
                  </Col>
                </OverlayTrigger>
              )
            }
          }.bind(this))}
        </Row>
      </div>
    )
  }
});