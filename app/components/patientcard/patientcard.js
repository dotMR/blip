/** @jsx React.DOM */
/**
 * Copyright (c) 2014, Tidepool Project
 *
 * This program is free software; you can redistribute it and/or modify it under
 * the terms of the associated License, which is identical to the BSD 2-Clause
 * License as published by the Open Source Initiative at opensource.org.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the License for more details.
 *
 * You should have received a copy of the License along with this program; if
 * not, you can obtain one from Tidepool Project at tidepool.org.
 */

var React = require('react');
var _ = require('lodash');
var cx = require('react/lib/cx');
var Router = require('react-router');
var Link = Router.Link;
var Navigation = Router.Navigation;

var personUtils = require('../../core/personutils');
var ModalOverlay = require('../modaloverlay');

var GroupActions = require('../../actions/GroupActions');
var GroupStore = require('../../stores/GroupStore');

var RemovePatientDialog = React.createClass({
  propTypes: {
    patient: React.PropTypes.object,
    onCancel: React.PropTypes.func
  },

  getInitialState: function() {
    return this.getStateFromStores();
  },

  getStateFromStores: function() {
    return {
      working: GroupStore.isLeaving(this.props.patient.userid)
    };
  },

  componentDidMount: function() {
    GroupStore.addChangeListener(this.handleStoreChange);
  },

  componentWillUnmount: function() {
    GroupStore.removeChangeListener(this.handleStoreChange);
  },

  handleStoreChange: function() {
    if (!this.isMounted()) {
      return;
    }
    this.setState(this.getStateFromStores());
  },

  render: function() {
    var disabled = this.state.working;
    var buttonText = this.state.working ? 'Removing...' : 'I\'m sure, remove me';

    return (
      <div>
        <div className="ModalOverlay-content">{"Are you sure you want to leave this person's Care Team? You will no longer be able to view their data."}</div>
        <div className="ModalOverlay-controls">
          <button className="PatientInfo-button PatientInfo-button--secondary" type="button" onClick={this.props.onCancel} disabled={disabled}>Cancel</button>
          <button className="PatientInfo-button PatientInfo-button--warning PatientInfo-button--primary" type="submit" onClick={this.handleRemovePatient} disabled={disabled}>{buttonText}</button>
        </div>
      </div>
    );
  },

  handleRemovePatient: function() {
    // Note: this component will unmount
    // when leaving group is complete
    GroupActions.leave(this.props.patient.userid);
  }
});

var PatientCard = React.createClass({
  propTypes: {
    patient: React.PropTypes.object,
    isEditing: React.PropTypes.bool,
    isNavbar: React.PropTypes.bool,
    navbarActive: React.PropTypes.string,
    onClick: React.PropTypes.func,
    uploadUrl: React.PropTypes.string
  },

  mixins: [Navigation],

  getInitialState: function() {
    return {
      showModalOverlay: false
    };
  },

  render: function() {
    var patient = this.props.patient;
    var self = this;
    var classes = cx({
      'patientcard': true,
      'isEditing': this.props.isEditing
    });

    var view = this.renderView(patient);
    var remove = this.renderRemove(patient);
    var upload = this.renderUpload(patient);
    var share = this.renderShare(patient);
    var profile = this.renderProfile(patient);

    /* jshint ignore:start */
    return (
      <div>
        <div onMouseEnter={this.setHighlight('view')} onMouseLeave={this.setHighlight('')} className={classes}
          onClick={this.onClick}>
          <i className="Navbar-icon icon-face-standin"></i>
          <div className="patientcard-info">
            <div className="patientcard-fullname">{this.getFullName()} {profile}</div>
            <div className="patientcard-actions">
              {view}
              {share}
              {upload}
            </div>
          </div>
          <div className="patientcard-leave">
            {remove}
          </div>
          <div className="clear"></div>
        </div>
        {this.renderModalOverlay()}
      </div>
    );
    /* jshint ignore:end */
  },

  renderView: function() {
    var classes = cx({
      'patientcard-actions-view': true,
      'patientcard-actions--highlight': (!this.props.isNavbar && this.state.highlight === 'view') || this.props.navbarActive === 'data'
    });

    return (
      <Link
        className={classes}
        to="patient-data"
        params={{patientId: this.props.patient.userid}}
        onClick={this.props.onClick}>
        View
      </Link>
    );
  },

  renderProfile: function(patient) {
    if (!this.props.isNavbar) {
      return;
    }

    var classes = cx({
      'patientcard-actions-profile': true,
      'patientcard-actions--highlight': (!this.props.isNavbar && this.state.highlight === 'profile') || this.props.navbarActive === 'profile'
    });

    var iconClass = cx({
      'patientcard-icon': true,
      'icon-settings': true,
      'patientcard-icon--highlight': this.props.navbarActive === 'profile'
    });

    return (
      <Link
        className={classes}
        to="patient-profile"
        params={{patientId: this.props.patient.userid}}
        onClick={this.stopPropagation}
        onMouseEnter={this.setHighlight('profile')}
        onMouseLeave={this.setHighlight('view')}
        title="Profile">
        <i className={iconClass}></i>
      </Link>
    );
  },

  renderRemove: function(patient) {
    var classes = cx({
      'patientcard-actions--highlight': this.state.highlight === 'remove'
    });

    if (_.isEmpty(patient.permissions) === false && (!patient.permissions.admin && !patient.permissions.root)) {
      var title = 'Remove yourself from ' + this.getFullName() + "'s care team.";

      return (
        /* jshint ignore:start */
        <a className={classes} href="" onMouseEnter={this.setHighlight('remove')} onMouseLeave={this.setHighlight('view')} onClick={this.handleRemove} title={title}>
          <i className="Navbar-icon icon-delete"></i>
        </a>
        /* jshint ignore:end */
      );
    }
  },

  renderUpload: function(patient) {
    var classes = cx({
      'patientcard-actions-upload': true,
      'patientcard-actions--highlight': this.state.highlight === 'upload'
    });

    if(_.isEmpty(patient.permissions) === false && patient.permissions.root) {
      return (
        /* jshint ignore:start */
        <a className={classes} onClick={this.stopPropagation} onMouseEnter={this.setHighlight('upload')} onMouseLeave={this.setHighlight('view')} href={this.props.uploadUrl} target='_blank' title="Upload data">Upload</a>
        /* jshint ignore:end */
      );
    }

    return null;
  },

  renderShare: function(patient) {
    var classes = cx({
      'patientcard-actions-share': true,
      'patientcard-actions--highlight': (!this.props.isNavbar && this.state.highlight === 'share')  || this.props.navbarActive === 'share'
    });

    if(_.isEmpty(patient.permissions) === false && patient.permissions.root) {
      return (
        <Link
          to="patient-share"
          params={{patientId: this.props.patient.userid}}
          className={classes}
          onClick={this.stopPropagation}
          onMouseEnter={this.setHighlight('share')}
          onMouseLeave={this.setHighlight('view')}
          title="Share data">
          Share
        </Link>
      );
    }

    return null;
  },

  renderRemoveDialog: function() {
    return <RemovePatientDialog
      patient={this.props.patient}
      onCancel={this.overlayClickHandler} />;
  },

  renderModalOverlay: function() {
    return (
      /* jshint ignore:start */
      <ModalOverlay
        show={this.state.showModalOverlay}
        dialog={this.state.dialog}
        overlayClickHandler={this.overlayClickHandler}/>
      /* jshint ignore:end */
    );

  },

  handleRemove: function(e) {
    e.preventDefault();
    e.stopPropagation();
    this.setState({
      showModalOverlay: true,
      dialog: this.renderRemoveDialog()
    });
  },

  overlayClickHandler: function() {
    this.setState({
      showModalOverlay: false
    });
  },

  getFullName: function() {
    return personUtils.patientFullName(this.props.patient);
  },

  setHighlight: function(highlight) {
    var self = this;
    return function() {
      self.setState({
        highlight: highlight
      });
    };
  },

  stopPropagation: function(event) {
    event.stopPropagation();
  },

  onClick: function() {
    this.transitionTo('patient-data', {patientId: this.props.patient.userid});
    this.props.onClick();
  }
});

module.exports = PatientCard;
