import { createError, proxyRequest } from 'h3';
function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
export default defineEventHandler(async (event) => {

  const runtimeConfig = useRuntimeConfig()?.shopinvader || {}
  const config = runtimeConfig?.erp?.proxy || null
  if(!config) {
    return createError({
      statusCode: 500,
      statusMessage: 'No proxy config found',
    });
  }

  try {
    const url:string = event.node.req.url?.replace('/shopinvader', '') || '';
    const reqHeaders = getHeaders(event)

    let headers:HeadersInit = {
      'Content-Type': reqHeaders?.['content-type'] || 'application/json',
    }

    if(config?.auth) {
      headers['Authorization'] = config.auth
    }
    await sleep(1000)
    return await proxyRequest(event, `${config?.url}${url}`, {
      headers,
    })
  } catch (error:any) {
    return createError({
      statusCode: error?.response?.status,
      statusMessage: error?.message,
      data: error?.data,
    });
  }
})
