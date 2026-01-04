import { defineMiddleware, sequence } from "astro:middleware";

const validation =  defineMiddleware(async (_, next) => {
    console.log("validation request");
    const response = await next();
    console.log("validation response");
    return response;
})

const auth =  defineMiddleware(async (_, next) => {
    console.log("auth request");
    const response = await next();
    console.log("auth response");
    return response;
})

const greeting = defineMiddleware(async (_, next) => {
    console.log("greeting request");
    const response = await next();
    console.log("greeting response");
    return response;
});

export const onRequest = sequence(validation, auth, greeting);