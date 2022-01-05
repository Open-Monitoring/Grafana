// Libraries
import React, { PureComponent } from 'react';
import classNames from 'classnames';
import AutoSizer from 'react-virtualized-auto-sizer';
import { connect, ConnectedProps } from 'react-redux';

// Components
import { PanelChrome } from './PanelChrome';
import { PanelChromeAngular } from './PanelChromeAngular';

// Actions
import { initDashboardPanel } from '../state/actions';

// Types
import { DashboardModel, PanelModel } from '../state';
import { StoreState } from 'app/types';
import { PanelPlugin } from '@grafana/data';

export interface OwnProps {
  panel: PanelModel;
  dashboard: DashboardModel;
  isEditing: boolean;
  isViewing: boolean;
  isInView: boolean;
}

export interface State {
  isLazy: boolean;
}

const mapStateToProps = (state: StoreState, props: OwnProps) => {
  const panelState = state.dashboard.panels[props.panel.id];
  if (!panelState) {
    return { plugin: null };
  }

  return {
    plugin: panelState.plugin,
  };
};

const mapDispatchToProps = { initDashboardPanel };

const connector = connect(mapStateToProps, mapDispatchToProps);

export type Props = OwnProps & ConnectedProps<typeof connector>;

export class DashboardPanelUnconnected extends PureComponent<Props, State> {
  specialPanels: { [key: string]: Function } = {};

  constructor(props: Props) {
    super(props);

    this.state = {
      isLazy: !props.isInView,
    };
  }

  componentDidMount() {
    this.props.initDashboardPanel(this.props.panel);
  }

  componentDidUpdate() {
    if (this.state.isLazy && this.props.isInView) {
      this.setState({ isLazy: false });
    }
  }

  onMouseEnter = () => {
    this.props.dashboard.setPanelFocus(this.props.panel.id);
  };

  onMouseLeave = () => {
    this.props.dashboard.setPanelFocus(0);
  };

  renderPanel(plugin: PanelPlugin) {
    const { dashboard, panel, isViewing, isInView, isEditing } = this.props;

    return (
      <AutoSizer>
        {({ width, height }) => {
          if (width === 0) {
            return null;
          }

          if (plugin.angularPanelCtrl) {
            return (
              <PanelChromeAngular
                plugin={plugin}
                panel={panel}
                dashboard={dashboard}
                isViewing={isViewing}
                isEditing={isEditing}
                isInView={isInView}
                width={width}
                height={height}
              />
            );
          }

          return (
            <PanelChrome
              plugin={plugin}
              panel={panel}
              dashboard={dashboard}
              isViewing={isViewing}
              isEditing={isEditing}
              isInView={isInView}
              width={width}
              height={height}
            />
          );
        }}
      </AutoSizer>
    );
  }

  render() {
    const { isViewing, plugin } = this.props;
    const { isLazy } = this.state;

    // if we have not loaded plugin exports yet, wait
    if (!plugin) {
      return null;
    }

    // If we are lazy state don't render anything
    if (isLazy) {
      return null;
    }

    const panelWrapperClass = classNames({
      'panel-wrapper': true,
      'panel-wrapper--view': isViewing,
    });

    return (
      <div className={panelWrapperClass} onMouseEnter={this.onMouseEnter} onMouseLeave={this.onMouseLeave}>
        {this.renderPanel(plugin)}
      </div>
    );
  }
}

export const DashboardPanel = connector(DashboardPanelUnconnected);
