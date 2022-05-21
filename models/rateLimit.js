export default class RateLimit{

    #windowMiliseconds = 0;
    #requests = 0;
    #punishMiliseconds = 0;
    
    ipController = []
    ipPunish = []

    constructor(windowMiliseconds, requests, punishMiliseconds){
        this.#windowMiliseconds = windowMiliseconds
        this.#requests = requests
        this.#punishMiliseconds = punishMiliseconds
    }

    static config({windowMs, requests, punishMs}){
        const ratelimit = new RateLimit(windowMs, requests, punishMs)
        return (request) =>  ratelimit.ratelimit(request)
    }

    ratelimit(request){
        
    }
    

}