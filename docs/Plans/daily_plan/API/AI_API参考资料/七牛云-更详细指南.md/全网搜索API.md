全网搜索 API
最近更新时间: 2025-12-23 17:11:53

简介
本接口提供高质量的全网搜索服务（即百度Search API）。
支持多种搜索类型和过滤条件，返回结构化的搜索结果，适用于智能问答、内容聚合、信息检索等多种应用场景。

功能特性
多种搜索类型：支持网页搜索、图片搜索等多种搜索模式
灵活过滤：支持时间过滤、站点过滤等多维度筛选条件
结构化结果：返回标准化的搜索结果，包含标题、链接、摘要、来源等完整信息
高可用性：基于成熟的搜索引擎技术，提供稳定可靠的搜索服务
易于集成：标准 RESTful API，便于与各类系统对接
API 接入点
https://api.qnaigc.com/v1
API 调用方式
获取接口密钥
使用前提：获取 API KEY(API 密钥)
1. 请求示例
使用 curl 命令调用搜索接口：

export OPENAI_BASE_URL="https://api.qnaigc.com/v1"
export OPENAI_API_KEY="<你的七牛云 AI API KEY>"
curl --location "$OPENAI_BASE_URL/search/web" \
  --header "Content-Type: application/json" \
  --header "Authorization: Bearer $OPENAI_API_KEY" \
  --data '{
    "query": "今日新闻",
    "max_results": 10,
    "search_type": "web",
    "time_filter": "year",
    "site_filter": ["news.cctv.com", "www.xinhuanet.com"]
  }'
参数说明
参数名	类型	必填	说明
query	string	是	搜索关键词或查询语句
max_results	int	否	返回结果数量，网页搜索默认20，最大50，视频最大10（默认5），图片搜索最大30（默认15）
search_type	string	否	搜索类型，默认"web"（网页搜索）
time_filter	string	否	时间过滤，可选值：week（一周内）、month（一月内）、year（一年内）、semiyear(半年内)
site_filter	array	否	站点过滤，指定搜索特定网站的内容（最多20个）
搜索类型说明
搜索类型	说明
web	网页搜索（默认）
video	视频搜索
image	图片搜索
返回结果示例
{
  "success": true,
  "data": {
    "query": "今日新闻",
    "results": [
      {
        "id": 1,
        "title": "美政府"停摆"40天 共和党称"已有协议"拟今日表决",
        "url": "https://news.cctv.com/2025/11/10/ARTI4CtlbQAsLlX48iMqqvBE251110.shtml",
        "content": "美东时间11月9日,是本次美国政府自10月1日"停摆"以来的第40天。政府"停摆"已经在过去的一个多月内给全美多行业带来负面影响...",
        "date": "2025-11-10 09:14:08",
        "source": "央视国际",
        "score": 1,
        "type": "web",
        "icon": "https://search-operate.cdn.bcebos.com/d6289c25f5be88e38885ced0f53b60ef.jpeg",
        "authority_score": 1
      },
      {
        "id": 2,
        "title": "重要数据,今日公布;下周一,巴菲特发声",
        "url": "https://finance.eastmoney.com/a/202511093558946224.html",
        "content": "据新华社,商务部新闻发言人就安世半导体问题答记者问。中方注意到荷兰经济大臣卡雷曼斯于11月6日发表的声明...",
        "date": "2025-11-09 08:29:00",
        "source": "东方财富网",
        "score": 1,
        "type": "web",
        "icon": "https://finance.eastmoney.com/favicon.ico",
        "authority_score": 1
      }
    ],
    "total": 17,
    "request_id": "3b3d247c-719a-4856-a231-f35614bfa840"
  }
}
返回字段说明
响应结构
字段名	类型	说明
success	boolean	请求是否成功
message	string	错误信息（仅在失败时返回）
data	object	搜索结果数据
搜索结果数据（data）
字段名	类型	说明
query	string	搜索查询词
results	array	搜索结果列表
total	int	搜索结果总数
request_id	string	本次请求的唯一标识
搜索结果项（results 数组元素）
字段名	类型	说明
id	int	结果项ID
title	string	页面标题
url	string	页面链接
content	string	页面摘要内容
date	string	发布时间
source	string	来源网站名称
score	float	相关性评分
type	string	结果类型（web/news等）
icon	string	网站图标链接
authority_score	float	权威性评分
image	包含三个字段：url,height,width,表达图片的链接，高，宽	图片
video	包含： url,height,width,size（单位bytes）,duration（时长，单位秒）,hover_pic(封面url)	对于url为空的情况，上级的页面链接url字段为视频平台链接，视频本身无直接url
示例代码
import requests
import json
def web_search(query, max_results=10):
    url = "https://api.qnaigc.com/v1/search/web"
    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer YOUR_API_KEY"
    }
    
    data = {
        "query": "今日新闻",
        "max_results": 10,
        "search_type": "web"
    }
    
    response = requests.post(url, headers=headers, json=data)
    
    if response.status_code == 200:
        result = response.json()
        if result["success"]:
            return result["data"]
        else:
            print(f"搜索失败: {result['message']}")
    else:
        print(f"请求失败: {response.status_code}")
    
    return None
# 使用示例
results = web_search("今日新闻", 5)
if results:
    print(f"找到 {results['total']} 个结果")
    for item in results['results']:
        print(f"标题: {item['title']}")
        print(f"链接: {item['url']}")
        print(f"摘要: {item['content'][:100]}...")
        print("---")