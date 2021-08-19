import prompt from 'prompt-sync';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const api = axios.create({
    baseURL: 'https://api.github.com'
});

api.interceptors.request.use(req => ({
    ...req,
    Headers: {
        ...req.Headers,
        Authorization: `token ${process.env.GITHUB_TOKEN}`
    }
}))

const input = (value) => prompt()(value);

const pagesTotal = (value) => Math.ceil(value / 100);

const profileLink = (name) => `https://www.github.com/${name}`;

function handleException(exception) {
    console.error('Unexpected error: ', exception?.response?.data?.message);
}

function intro() {
    console.clear();
    console.log('--------------------------');
    console.log('   FOLLOWS CHECK GITHUB   ');
    console.log('--------------------------\n');
}

async function fetchUser(username) {
    try {
        const response = await api.get(`users/${username}`);

        return response?.data;
    } catch (e) {
        handleException(e);
    }
}

async function fetchFollows(username, amount, type) {
    try {
        const pages = pagesTotal(amount);
        const follows = [];

        for (let page = 1; page <= pages; page++) {
            const response = await api.get(`users/${username}/${type}?per_page=100&page=${page}`);

            follows.push(...response?.data?.map(x => x?.login));
        }

        return follows;
    } catch (error) {
        handleException(error);
    }
}

async function fetchUserInfo(username) {
    try {
        const user = await fetchUser(username);
        const followers = await fetchFollows(username, user?.followers, 'followers');
        const following = await fetchFollows(username, user?.following, 'following');

        return {
            user,
            followers,
            following,
        }
    } catch (error) {
        handleException(error);
    }
}



function handleMenuOptions(option, following, followers) {
    const info = 
        following
        ?.filter(x => option === 1 ? followers.includes(x) : !followers.includes(x))
        ?.map(x => profileLink(x));

    console.log(info);
}

async function main() {
    try {
        let repeat = false;
        
        do {
            intro();
    
            const username = input('Github username: ');
    
            if (!username) return;

            const { user, followers, following } = await fetchUserInfo(username);
    
            console.log('Following: ', user?.following);
            console.log('Followers: ', user?.followers);
            console.log('Followers: ', followers);
            console.log('Following: ', following);
    
            console.log('\n');

            console.log('[1] Who follows you back');
            console.log('[2] Who doesnt follow you back');
            const option = Number(input('Option: '));

            if (option !== 1 && option !== 2) return;
            
            handleMenuOptions(option, following, followers);
                        
            repeat = input('Repeat? (y/N): ');
        } while (repeat.toLowerCase() === 'y');
    } catch (e) {
        handleException(e);
    }
}

main();