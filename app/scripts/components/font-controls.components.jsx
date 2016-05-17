import React from 'react';
import {ControlsTabs, ControlsTab} from './controls-tabs.components.jsx';
import {Sliders} from './sliders.components.jsx';
import Lifespan from 'lifespan';
import LocalClient from '../stores/local-client.stores.jsx';
import LocalServer from '../stores/local-server.stores.jsx';
import {BatchUpdate} from '../helpers/undo-stack.helpers.js';
import {FontValues} from '../services/values.services.js';

export default class FontControls extends React.Component {

	constructor(props) {
		super(props);
		this.state = {
			tabControls: 'Func',
		};
	}

	async componentWillMount() {
		this.lifespan = new Lifespan();
		this.client = LocalClient.instance();
		const server = new LocalServer().instance;

		const fontControls = await this.client.fetch('/fontControls');
		const fontParameters = await this.client.fetch('/fontParameters');
		const fontVariant = await this.client.fetch('/fontVariant');
		const typeface = fontVariant.get('variant') || {};

		const debouncedSave = _.debounce((values) => {
			FontValues.save({
				typeface: typeface.db || 'default',
				values,
			});
		}, 300);

		this.undoWatcher = new BatchUpdate(fontControls,
			'/fontControls',
			this.client,
			this.lifespan,
			(name) => {
				return `modifier ${name}`;
			},
			(headJS) => {
				debouncedSave(headJS.values);
			}
			);

		server.on('action', ({path, params}) => {
			if (path === '/change-param') {
				const newParams = {};

				Object.assign(newParams, fontControls.get('values'));

				if (this.state.indivMode && this.state.indivEdit && !params.values) {
					if (newParams.indiv_group_param[this.state.currentGroup][params.name]) {
						newParams.indiv_group_param[this.state.currentGroup][params.name].value = params.value;
					}
					else {
						newParams.indiv_group_param[this.state.currentGroup][params.name] = {
							state: 'relative',
							value: params.value,
						};
					}
				}
				else if (params.values) {
					_.assign(newParams, params.values);
				}
				else {
						newParams[params.name] = params.value;
				}


				const patch = fontControls.set('values', newParams).commit();

				server.dispatchUpdate('/fontControls', patch);

				if (params.force) {

					//TODO(franz): This SHOULD totally end up being in a flux store on hoodie
					this.undoWatcher.forceUpdate(patch, params.label);
					debouncedSave(newParams);
				}
				else {

					this.undoWatcher.update(patch, params.label);

				}

			}
			else if (path === '/change-param-state') {
				const newParams = {};

				Object.assign(newParams, fontControls.get('values'));

				newParams.indiv_group_param[this.state.currentGroup][params.name] = {
					state: params.state,
					value: params.state === 'relative' ? 1 : 0,
				};

				const patch = fontControls.set('values', newParams).commit();

				server.dispatchUpdate('/fontControls', patch);

				if (params.force) {

					//TODO(franz): This SHOULD totally end up being in a flux store on hoodie
					this.undoWatcher.forceUpdate(patch, params.label);
					debouncedSave(newParams);
				}
				else {

					this.undoWatcher.update(patch, params.label);

				}
			}}, this.lifespan);

		this.client.getStore('/fontTab', this.lifespan)
			.onUpdate(({head}) => {
				const headJS = head.toJS();

				this.setState({
					tabControls: headJS.tab,
				});
			})
			.onDelete(() => {this.setState(undefined);});

		this.client.getStore('/fontControls', this.lifespan)
			.onUpdate(({head}) => {
				const headJS = head.toJS();

				this.setState({
					values: headJS.values,
				});
				this.client.dispatchAction('/update-font', headJS.values);
			})
			.onDelete(() => {this.setState(undefined);});

		this.client.getStore('/individualizeStore', this.lifespan)
			.onUpdate(({head}) => {
				const headJS = head.toJS();

				this.setState({
					indivMode: headJS.indivMode,
					indivEdit: headJS.indivEdit,
					currentGroup: headJS.currentGroup,
				});
			})
			.onDelete(() => {this.setState(undefined);});

		this.client.getStore('/fontParameters', this.lifespan)
			.onUpdate(({head}) => {
				const headJS = head.toJS();

				this.setState({
					parameters: headJS.parameters,
				});
			})
			.onDelete(() => {this.setState(undefined);});

		const parameters = fontParameters.get('parameters');
		const values = fontControls.get('values');

		this.setState({
			parameters,
			values,
		});
	}

	componentWillUnmount() {
		this.lifespan.release();
	}

	render() {
		if (process.env.__SHOW_RENDER__) {
			console.log('[RENDER] font controls');
		}

		const tabs = _.map(this.state.parameters, (group) => {
			return (
				<ControlsTab iconId={group.label} name={group.label} key={group.label}>
					<Sliders
						params={group.parameters}
						values={this.state.values}
						indivMode={this.state.indivMode}
						indivEdit={this.state.indivEdit}
						currentGroup={this.state.currentGroup}/>
				</ControlsTab>
			);
		});

		tabs.unshift(<ControlsTab iconId="func" name="settings" key="settings"></ControlsTab>);

		return (
			<div className="font-controls" id="sidebar">
				<ControlsTabs tab={this.state.tabControls} >
					{tabs}
				</ControlsTabs>
			</div>
		);
	}
}
