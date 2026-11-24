import pkg from '../../../../package.json';
export const dynamic='force-static';
export function GET(){
 return Response.json({version:pkg.version,revision:process.env.MUSICLUB_BUILD_SHA},{headers:{'Cache-Control':'no-store'}});
}
