const admin = require('firebase-admin')
const fetch = require('node-fetch')
const { TwitterApi } = require( 'twitter-api-v2')

//https://app.scaleserp.com/playground
//https://stackoverflow.help/en/articles/4385859-stack-overflow-for-teams-api
//https://api.stackexchange.com/docs/search#order=desc&sort=activity&intitle=jaavascript&filter=default&site=stackoverflow&run=true

const getTabNews = async () => {
  const response = await fetch(`https://www.tabnews.com.br/api/v1/contents?page=1&per_page=50&strategy=relevant`)
  return await response.json()
}

const tweet = async (text,links) => {
  console.log('tweet tab news ranking started')  
  if(!text) return null
  const TWITTER_CREDENTIALS = JSON.parse(process.env.TWITTER_API || '{"appKey":"","appSecret":"","accessToken":"","accessSecret":""}')
  const client = new TwitterApi(TWITTER_CREDENTIALS)
  const tweet = await client.v2.tweet(text)
  if(links && links.length) await client.v2.reply(links,tweet.data.id)
  console.log('tweet tab news ranking finished')
}

const formatDt = (date) => {
  const yyyy = date.getFullYear();
  let mm = date.getMonth() + 1; // Months start at 0!
  let dd = date.getDate();
  if (dd < 10) dd = '0' + dd;
  if (mm < 10) mm = '0' + mm;
  return `${dd}/${mm}/${yyyy}`
}

exports.tweetTabNewsRanking = async () => {
  try{
    console.log('runTabNews started')
    const results = await getTabNews()
    try{
      if(results.length){
        const posts = results.filter(result=>{
          //isYesterday?
          const today = new Date();
          const yesterday = new Date(today);
          yesterday.setDate(today.getDate() - 1);

          const date = new Date(result.created_at);
          return (
            date.getFullYear() === yesterday.getFullYear() &&
            date.getMonth() === yesterday.getMonth() &&
            date.getDate() === yesterday.getDate()
          )
        }).sort((a,b) => b.tabcoins - a.tabcoins)

        if(posts && posts.length) {
          const ranking = posts.slice(0,3).map((item,index)=>{
            if(index===0){
              return `🥇 ${item.owner_username} • ${item.tabcoins} tabcoins\nhttps://www.tabnews.com.br/${item.owner_username}/${item.slug}`
            } else if(index===1){
              return `🥈 ${item.owner_username} • ${item.tabcoins} tabcoins`
            } else if(index===2){
              return `🥉 ${item.owner_username} • ${item.tabcoins} tabcoins`
            }
          })
          const links = posts.slice(1,3).reverse().map((item,index)=>{
            if(index===0){
              return `🥉 ${item.owner_username} • ${item.title}\nhttps://www.tabnews.com.br/${item.owner_username}/${item.slug}`
            } else if(index===1){
              return `🥈 ${item.owner_username} https://www.tabnews.com.br/${item.owner_username}/${item.slug}`
            } 
          })

          const today = new Date();
          const date = new Date(today);
          date.setDate(today.getDate() - 1);
  
          tweet(`Top 3 ${formatDt(date)}\n\n${ranking.join('\n\n')}\n\n#bolhadev`,links.join('\n\n'))
        }

        const promises = posts.map(item=>{
          return admin.firestore().collection('tabNewsRanking').doc(item.id).set({...item,...{tweet:false}})
        })

        await Promise.all(promises)
      }
    }catch(e){        
      console.log(e)
    }
    console.log('runTabNews finished')  
  }catch(e){
    console.log(e)
  }  
}

//https://www.tabnews.com.br/api/v1/analytics/root-content-published
//https://www.tabnews.com.br/api/v1/contents?page=1&per_page=50&strategy=new

