import {PoolPage} from '../../../views/PoolPage';
export default async function Page({params}) {
  const {code}=await params;
  return <PoolPage code={code}/>;
}
