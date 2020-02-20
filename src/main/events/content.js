const AuthenticationManager = require('../lib/AuthenticationManager')
const { ipcMain } = require('electron')
const dateformat = require('dateformat')
const ProviderApiManager = require('../lib/ProviderApiManager')
const tumblr = require("../apis/tumblr-api")

module.exports = () => {
	ipcMain.on("fetch-posts", (evt, authUUID, blogName, options) => {
    let auth = AuthenticationManager.findByUUID(authUUID)
    let api = ProviderApiManager.getApi(auth.provider)
		if (!api.validateAuthInfo(auth.authInfo)) {
      evt.sender.send('receive-message', '글 목록을 불러오지 못했습니다.')
      evt.sender.send('receive-posts-failed')
			return
    }
    
    api.fetchPosts(auth.authInfo, blogName, options)
      .then(posts => {
        evt.sender.send('receive-posts', posts)
      })
      .catch(err => {
        evt.sender.send('receive-message', '글 목록을 불러오지 못했습니다.')
        evt.sender.send('receive-posts-failed')
      })
  })
  
  ipcMain.on("fetch-content", (evt, authUUID, blogName, postId) => {
    let auth = AuthenticationManager.findByUUID(authUUID)
    if (auth.provider != 'tistory') {
      evt.sender.send('receive-message', '글 정보를 불러오지 못했습니다.')
      return
    }

    let api = ProviderApiManager.getApi(auth.provider)
		api.fetchContent(auth.authInfo, blogName, postId).then(res => {
			evt.sender.send('receive-content', res.post)
		}).catch(err => {
			console.error(err)
			evt.sender.send('receive-message', '글 정보를 불러오지 못했습니다.')
		})
	})
	
	ipcMain.on("save-content", (evt, authUUID, blogName, post) => {
		let auth = AuthenticationManager.findByUUID(authUUID)
		let messagePrefix = dateformat(new Date(), 'HH:MM:ss : ')

		if (!auth || !auth.token) {
			evt.sender.send('finish-save-content')
			evt.sender.send('receive-message', messagePrefix + '글을 수정하지 못했습니다.')
			return
		}

    tumblr.savePost(auth, blogName, post)
      .then(async res => {
        let postResponse = await tumblr.fetchPost(auth, blogName, res.id)
        evt.sender.send('finish-save-content', postResponse.posts[0])
        evt.sender.send('receive-message', messagePrefix + ' 수정완료')
      })
      .catch(err => {
        console.error(err)
        evt.sender.send('finish-save-content')
        evt.sender.send('receive-message', messagePrefix + '글을 수정하지 못했습니다.')
      })
	})

	ipcMain.on("add-content", (evt, authUUID, blogName, post) => {
		let auth = AuthenticationManager.findByUUID(authUUID)
		let messagePrefix = dateformat(new Date(), 'HH:MM:ss : ')

		if (!auth || !auth.token) {
			evt.sender.send('finish-add-content')
			evt.sender.send('receive-message', messagePrefix + '글을 발행하지 못했습니다.')
			return
    }
    
    tumblr.addPost(auth, blogName, post)
      .then(async res => {
        let postResponse = await tumblr.fetchPost(auth, blogName, res.id)
        evt.sender.send('finish-add-content', postResponse.posts[0])
        evt.sender.send('receive-message', messagePrefix + '발행 완료')
      })
      .catch(err => {
        console.error(err)
        evt.sender.send('finish-add-content')
        evt.sender.send('receive-message', messagePrefix + '글을 발행하지 못했습니다.')
      })
	})

}
