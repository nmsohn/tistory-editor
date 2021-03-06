import React, { Component } from 'react'
import { ipcRenderer } from 'electron'
import autobind from 'autobind-decorator'
import update from 'immutability-helper'
import { Button } from '@material-ui/core'
import Loading from '../../../Loading'
import PhotoList from './PhotoList'

class GooglePhotos extends Component {

	constructor(props, context) {
		super(props, context)
		this.state = {
			initialized: false,
      images: [],
      nextPageToken: null,
			fetching: false
		}
	}

	componentWillMount() {
		ipcRenderer.on("receive-google-photos-images", this.handleReceiveImages)
		ipcRenderer.on("start-fetch-google-photos-images", this.handleStartFetch)
		ipcRenderer.on("receive-google-connected", this.handleReceiveConnected)
	}

	componentWillUnmount() {
		ipcRenderer.removeListener("receive-google-photos-images", this.handleReceiveImages)
		ipcRenderer.removeListener("start-fetch-google-photos-images", this.handleStartFetch)
		ipcRenderer.removeListener("receive-google-connected", this.handleReceiveConnected)
	}

	componentDidMount() {
		this.handleRequestFetch()
	}

	@autobind
	handleReceiveImages(e, data) {
    const { onConnect, onDisconnect } = this.props
		const { images, fetching } = this.state
		if (data === null) {
      onDisconnect()
			return
		}

		this.setState({
			initialized: true,
			images: update(images, {
				$push: data.images
      }),
      nextPageToken: data.nextPageToken,
			fetching: false
    })
    onConnect(true)
	}

	@autobind
	handleReceiveConnected(e, connected) {
    const { onConnect, onDisconnect } = this.props
		if (connected) {
			this.setState({
				initialized: true,
      })
      onConnect()
		} else {
			this.setState({
				initialized: true,
        images: [],
        nextPageToken: null,
      })
      onDisconnect()
    }
	}

	@autobind
	handleStartFetch(e) {
		this.setState({
			fetching: true
		})
	}

	@autobind
	handleRequestFetch() {
    const { nextPageToken } = this.state
		ipcRenderer.send('fetch-google-photos-images', nextPageToken)
	}

	@autobind
	handleRequestAuth() {
		ipcRenderer.send("request-google-photos-auth")
	}


	@autobind
	handleImageSelect(image) {
		const { onSelectImage } = this.props
		if (confirm('이미지를 삽입하시겠습니까?')) {
			onSelectImage(image.url, image.title)
		}
	}

	render() {
    const { connected } = this.props
		const { initialized, images, fetching } = this.state

		if (!initialized) {
			return (
				<div className="google-photos-wrap">
					<div className="google-photos-cover">
						<Loading position='absolute' />
					</div>
				</div>
			)
		}

		if (!connected) {
			return (
				<div className="google-photos-wrap">
					<div className="google-photos-cover">
						<Button variant='contained' className='btn btn_tistory' onClick={this.handleRequestAuth}>
              Google Photos 연결
            </Button>
					</div>
				</div>	
			)
		}

		return (
			<PhotoList images={images} fetching={fetching}
				onFetch={this.handleRequestFetch}
				onClick={this.handleImageSelect} />
		)
	}
}

export default GooglePhotos
