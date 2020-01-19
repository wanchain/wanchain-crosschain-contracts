const path = require("path");

const xInfo = [
  "ec4916dd28fc4c10d78e287ca5d9cc51ee1ae73cbfde08c6b37324cbfaac8bc5",
  "9267d3dbed802941483f1afa2a6bc68de5f653128aca9bf1461c5d0a3ad36ed2",
  "d9147961436944f43cd99d28b2bbddbf452ef872b30c8279e255e7daafc7f946",
  "e38990d0c7fc009880a9c07c23842e886c6bbdc964ce6bdd5817ad357335ee6f",
  "96de8fc8c256fa1e1556d41af431cace7dca68707c78dd88c3acab8b17164c47",
  "d1ec675902ef1633427ca360b290b0b3045a0d9058ddb5e648b4c3c3224c5c68",
  "48428bdb7ddd829410d6bbb924fdeb3a3d7e88c2577bffae073b990c6f061d08",
  "38df1c1f64a24a77b23393bca50dff872e31edc4f3b5aa3b90ad0b82f4f089b6",
  "887bf140ce0b6a497ed8db5c7498a45454f0b2bd644b0313f7a82acc084d0027",
  "a3ecde0c1d9daa6b7a949c87a1af7963c69cb2c412fb3086c495f14630c17b7b",
  "99fdc3a44c06c65a307ea38acda009243287ccbbdb2b0ce423a25bb9b525d7f2",
  "c03eee8aa25e1b9fd36a28c6d3321bd0d0534a72034c40fcd9d75c70a610037e",
];

const wanAddrs = [
  "193e86756d8d4cf38493ce6881eb3a8f2966bb27",
  "293e86756d8d4cf38493ce6881eb3a8f2966bb27"
];

const pks = [
  "042c672cbf9858cd77e33f7a1660027e549873ce25caffd877f955b5158a50778f7c852bbab6bd76eb83cac51132ccdbb5e6747ef6732abbb2135ed0da1c341619",
  "047a5380730dde59cc2bffb432293d22364beb250912e0e73b11b655bf51fd7a8adabdffea4047d7ff2a9ec877815e12116a47236276d54b5679b13792719eebb9"
];

const htlcContractFile = {
  WASM : path.join(process.cwd(), "c++/htlc.eos.v.1/build/htlc.wasm"),
  ABI : path.join(process.cwd(), "c++/htlc.eos.v.1/build/htlc.abi"),
};

const signContractFile = {
  WASM : path.join(process.cwd(), "c++/htlc.eos.v.1/test/signature/sig.wasm"),
  ABI : path.join(process.cwd(), "c++/htlc.eos.v.1/test/signature/sig.abi"),
};

const nodeDict = {
  mainnet: {
    main: "main"
  },
  testnet: {
    58: {
      url: "http://192.168.1.58:8888",
      chainId: "9ca3bf1640911d99f16d9ae483126cb2bbcb1bf9ad8c2dc6aac3c4d29605cdd5"
    },
    eossweden: {
      url: "https://jungle.eossweden.org",
      chainId: "e70aaab8997e1dfce58fbfac80cbbb8fecec7b99cf982a9444273cbc64c41473"
    },
    eossweden: {
      url: "https://jungle.eosusa.news",
      chainId: "e70aaab8997e1dfce58fbfac80cbbb8fecec7b99cf982a9444273cbc64c41473"
    },
    jungle:"jungle",
  }
};

const customAccount = {
  mainnet: {
    "htlc": {
      name: "512332155123",
      privateKey: "5JyyPpjBXYBRDz4g9wT3VFPvU9p9whyWSghEia1D5b7owgn47nP",
    }
  },
  testnet: {
    "htlc": {
      name: "512332155123",
      privateKey: "5JyyPpjBXYBRDz4g9wT3VFPvU9p9whyWSghEia1D5b7owgn47nP",
    },
    "sign": {
      name: "3214ertyytre",
      privateKey: "5JpABcR3r1zwwGLUhZ6oykpZhoMRorUE9jCEErcLRHYVfY3Y4C6",
    },
    "token": {
      name: "edcrfvtgbyhn",
      privateKey: "5JMrg3FpW8KHteh3amSvkm9k3dfvYyEhWqNe3MhR4bQFLZqQQ1C",
    },
    "user1": {
      name: "wsxedcrfvtgb",
      privateKey: "5KBnqsEaMEeZwVguC3mFrkc28BhQEdfuFL3YZQAk7AbuzY3bFxb",
    },
    "user2": {
      name: "2345fghjvcxz",
      privateKey: "5JpABcR3r1zwwGLUhZ6oykpZhoMRorUE9jCEErcLRHYVfY3Y4C6",
    },
    "user3": {
      name: "wangluaccnt1",
      privateKey: "5K1csZUYhnJtrDcGACXGP4dASFZVi8NjbjnXSaw3c8nxrToLPcy",
    },
    "storeman1": {
      name: "3edcwertdfgh",
      privateKey: "5JyyPpjBXYBRDz4g9wT3VFPvU9p9whyWSghEia1D5b7owgn47nP",
    },
    "storeman2": {
      name: "mnbvcxzasdfg",
      privateKey: "5JU9uiA2r5cJtbvErWkKGvb77Y4xd6H5UfP5XhHGsBCk8wwaYCJ",
    },
  }
};

const sysTokenContract = {
  name: "eosio.token",
  action: 'transfer',
  token: {
    EOS: "4,EOS"
  }
};

const customTokenContract = {
  name: customAccount[global.network].token.name,
  action: "transfer",
  token: {
    EOS: "4,EOS",
    NS: "0,NS",
  }
};

const customSignContract = {
  name: customAccount[global.network].sign.name,
  action: "verify"
};

const permissionDict = {
  owner: "owner",
  active: "active",
  sign: "sign",
  token: "token",
};

const htlcTblDict = {
  pks: "pks",
  fees: "fees",
  assets: "assets",
  signer: "signer",
  debts: "debts",
  transfers: "transfers",
  longlongs: "longlongs",
};

const retryDict = {
  10: 10
};

const sleepTimeDict = {
  /* ms */
  100: 100,
  1000: 1000
};

const eosERROR = {
  3000000: "blockchain exception", /* 区块链异常 */ 
  3010000: "chain type exception", /* 链类型异常 */ 
  3010001: "Invalid name", /* 无效的名称 */ 
  3010002: "Invalid public key", /* 无效的公钥 */ 
  3010003: "Invalid private key", /* 无效的私钥 */ 
  3010004: "Invalid authority", /* 无效的授权 */ 
  3010005: "Invalid action", /* 无效的动作 */ 
  3010006: "Invalid transaction", /* 无效的交易 */ 
  3010007: "Invalid ABI", /* 无效的ABI */ 
  3010008: "Invalid block ID", /* 无效的区块ID */ 
  3010009: "Invalid transaction ID", /* 无效的交易ID */ 
  3010010: "Invalid packed transaction", /* 无效的打包交易 */ 
  3010011: "Invalid asset", /* 无效的资产 */ 
  3010012: "Invalid chain ID", /* 无效的链ID */ 
  3010013: "Invalid fixed key", /* 无效的固定密钥 */ 
  3010014: "Invalid symbol", /* 无效的代币符号 */ 
  3015000: "ABI exception", /* ABI异常 */ 
  3015001: "No ABI found", /* 没有找到ABI */ 
  3015002: "Invalid Ricardian Clause", /* 无效的李嘉图语句 */ 
  3015003: "Invalid Ricardian Action", /* 无效的李嘉图动作 */ 
  3015004: "The type defined in the ABI is invalid", /* ABI中定义的类型无效 */ 
  3015005: "Duplicate type definition in the ABI", /* ABI中存在重复定义的类型 */ 
  3015006: "Duplicate struct definition in the ABI", /* ABI中存在重复定义的结构 */ 
  3015007: "Duplicate action definition in the ABI", /* ABI中存在重复定义的动作 */ 
  3015008: "Duplicate table definition in the ABI", /* ABI中存在重复定义的数据表 */ 
  3015009: "Duplicate error message definition in the ABI", /* ABI中存在重复定义的错误信息 */ 
  3015010: "ABI serialization time has exceeded the deadline", /* ABI序列化时间超过截止值 */ 
  3015011: "ABI recursive definition has exceeded the max recursion depth", /* ABI中的递归定义超过最大允许深度 */ 
  3015012: "Circular definition is detected in the ABI", /* ABI中检测到循环定义 */ 
  3015013: "Unpack data exception", /* 解包数据发生异常 */ 
  3015014: "Pack data exception", /* 打包数据发生异常 */ 
  3015015: "Duplicate variant definition in the ABI", /* ABI中存在重复定义的变量 */ 
  3015016: "ABI has an unsupported version", /* 不支持的ABI版本 */ 
  3020000: "Fork database exception", /* 分叉数据库异常 */ 
  3020001: "Block can not be found", /* 找不到区块 */ 
  3030000: "Block exception", /* 区块异常 */ 
  3030001: "Unlinkable block", /* 无法链接的区块 */ 
  3030002: "Transaction outputs in block do not match transaction outputs from applying block", /* 指定区块与待应用区块中的交易输出不匹配 */ 
  3030003: "Block does not guarantee concurrent execution without conflicts", /* 区块不能保证无冲突并发执行 */ 
  3030004: "Shard locks in block are incorrect or mal-formed", /* 区块的分片锁不正确或格式错误 */ 
  3030005: "Block exhausted allowed resources", /* 区块已耗尽许可的资源 */ 
  3030006: "Block is too old to push", /* 区块太陈旧，无法提交 */ 
  3030007: "Block is from the future", /* 区块时间过早 */ 
  3030008: "Block is not signed with expected key", /* 区块签名与密钥不一致 */ 
  3030009: "Block is not signed by expected producer", /* 区块签名与出块人不一致 */ 
  3040000: "Transaction exception", /* 交易异常 */ 
  3040001: "Error decompressing transaction", /* 解压交易失败 */ 
  3040002: "Transaction should have at least one normal action", /* 交易至少应当包含一个常规动作 */ 
  3040003: "Transaction should have at least one required authority", /* 交易至少应当包含一个授权 */ 
  3040004: "Context-free action should have no required authority", /* 上下文无关动作不应当包含授权 */ 
  3040005: "Expired Transaction", /* 超时的交易 */ 
  3040006: "Transaction Expiration Too Far", /* 交易超时过久 */ 
  3040007: "Invalid Reference Block", /* 无效的参考块 */ 
  3040008: "Duplicate transaction", /* 重复的交易 */ 
  3040009: "Duplicate deferred transaction", /* 重复的延迟交易 */ 
  3040010: "Context free action is not allowed inside generated transaction", /* 在生成的交易中不允许出现上下文无关动作 */ 
  3040011: "The transaction can not be found", /* 交易找不到 */ 
  3040012: "Pushing too many transactions at once", /* 同时提交过多的交易 */ 
  3040013: "Transaction is too big", /* 交易过大 */ 
  3040014: "Unknown transaction compression", /* 未知的交易压缩方式 */ 
  3050000: "Action validate exception", /* 动作验证异常 */ 
  3050001: "Account name already exists", /* 账号名已经存在 */ 
  3050002: "Invalid Action Arguments", /* 无效的动作参数 */ 
  3050003: "eosio_assert_message assertion failure", /* 消息条件验证失败 */
  3050004: "eosio_assert_code assertion failure", /* 代码条件验证失败 */ 
  3050005: "Action can not be found", /* 找不到动作 */ 
  3050006: "Mismatch between action data and its struct", /* 动作数据和结构定义不匹配 */ 
  3050007: "Attempt to use unaccessible API", /* 试图访问不许可的API */ 
  3050008: "Abort Called", /* 中止被调用 */ 
  3050009: "Inline Action exceeds maximum size limit", /* 内联动作超过允许的最大尺寸 */ 
  3060000: "Database exception", /* 数据库异常 */ 
  3060001: "Permission Query Exception", /* 许可查询异常 */ 
  3060002: "Account Query Exception", /* 账号查询异常 */ 
  3060003: "Contract Table Query Exception", /* 合约数据表查询异常 */ 
  3060004: "Contract Query Exception", /* 合约查询异常 */ 
  3060100: "Guard Exception", /* 保护性异常 */ 
  3060101: "Database usage is at unsafe levels", /* 数据库利用处于不安全等级 */ 
  3060102: "Reversible block log usage is at unsafe levels", /* 可逆块日志利用处于不安全等级 */ 
  3070000: "WASM Exception", /* WASM异常 */ 
  3070001: "Error in WASM page memory", /* WASM内存页错误 */
  3070002: "Runtime Error Processing WASM", /* 处理WASM时发生运行时错误 */ 
  3070003: "Serialization Error Processing WASM", /* 处理WASM时发生序列化错误 */ 
  3070004: "Memcpy with overlapping memory", /* 内存拷贝时发生地址重叠 */ 
  3070005: "binaryen exception", /*binaryen异常 */ 
  3080000: "Resource exhausted exception", /* 资源耗尽异常 */ 
  3080001: "Account using more than allotted RAM usage", /* 账号使用的内存超限 */ 
  3080002: "Transaction exceeded the current network usage limit imposed on the transaction", /* 交易网络占用超限 */ 
  3080003: "Transaction network usage is too much for the remaining allowable usage of the current block", /* 交易网络占用过高 */ 
  3080004: "Transaction exceeded the current CPU usage limit imposed on the transaction", /* 交易CPU占用超限 */ 
  3080005: "Transaction CPU usage is too much for the remaining allowable usage of the current block", /* 交易CPU占用过高 */ 
  3080006: "Transaction took too long", /* 交易用时过长 */ 
  3080007: "Transaction exceeded the current greylisted account network usage limit", /* 交易超过当前灰名单账号的网络用量上限 */ 
  3080008: "Transaction exceeded the current greylisted account CPU usage limit", /* 交易超过当前灰名单账号的CPU用量上限 */ 
  3081001: "Transaction reached the deadline set due to leeway on account CPU limits", /* 由于账号CPU限制，交易已经达到截止区 */ 
  3090000: "Authorization exception", /* 授权异常 */ 
  3090001: "Duplicate signature included", /* 包含重复的签名 */ 
  3090002: "Irrelevant signature included", /* 包含不相关的签名 */ 
  3090003: "Provided keys, permissions, and delays do not satisfy declared authorizations", /* 提供的密钥、许可和延时不能满足声称的授权 */ 
  3090004: "Missing required authority", /* 授权丢失 */ 
  3090005: "Irrelevant authority included", /* 包含不相关的授权 */ 
  3090006: "Insufficient delay", /* 延时不足 */ 
  3090007: "Invalid Permission", /* 许可无效 */ 
  3090008: "The action is not allowed to be linked with minimum permission", /* 不允许该动作链接到最小许可 */ 
  3090009: "The parent permission is invalid", /* 父级许可无效 */ 
  3100000: "Miscellaneous exception", /* 其他异常 */ 
  3100001: "Internal state is no longer consistent", /* 内部状态不一致 */ 
  3100002: "Unknown block", /* 未知区块 */
  3100003: "Unknown transaction", /* 未知交易 */ 
  3100004: "Corrupted reversible block database was fixed", /* 被破坏的可逆区块数据库已修复 */ 
  3100005: "Extracted genesis state from blocks.log", /* 从区块日志中提取的创世状态 */ 
  3100006: "Subjective exception thrown during block production", /* 出块时抛出异常 */
  3100007: "Multiple voter info detected", /* 检测到多个投票人信息 */ 
  3100008: "Feature is currently unsupported", /* 当前不支持的特性 */ 
  3100009: "Node management operation successfully executed", /* 结果管理操作执行成功 */ 
  3110000: "Plugin exception", /* 插件异常 */ 
  3110001: "Missing Chain API Plugin", /* Chain API插件丢失 */ 
  3110002: "Missing Wallet API Plugin", /* Wallet API插件丢失 */ 
  3110003: "Missing History API Plugin", /* History API插件丢失 */ 
  3110004: "Missing Net API Plugin", /* Net API插件丢失 */ 
  3110005: "Missing Chain Plugin", /* Chain插件丢失 */ 
  3110006: "Incorrect plugin configuration", /* 插件配置不正确 */ 
  3120000: "Wallet exception", /* 钱包异常 */ 
  3120001: "Wallet already exists", /* 钱包已经存在 */ 
  3120002: "Nonexistent wallet", /* 钱包不存在 */ 
  3120003: "Locked wallet", /* 已锁定的钱包 */ 
  3120004: "Missing public key", /*公钥丢失 */ 
  3120005: "Invalid wallet password", /* 无效的钱包密码 */ 
  3120006: "No available wallet", /* 没有有效的钱包 */ 
  3120007: "Already unlocked", /* 已经解锁 */ 
  3120008: "Key already exists", /* 密钥已经存在 */ 
  3120009: "Nonexistent key", /* 不存在的密钥 */ 
  3120010: "Unsupported key type", /* 不支持的密钥类型 */ 
  3120011: "Wallet lock timeout is invalid", /* 钱包锁定超时无效 */ 
  3120012: "Secure Enclave Exception", /* 安全专区异常 */ 
  3130000: "Actor or contract whitelist/blacklist exception", /* 执行人或合约白名单/黑名单异常 */ 
  3130001: "Authorizing actor of transaction is not on the whitelist", /* 交易的授权执行人不在白名单中 */ 
  3130002: "Authorizing actor of transaction is on the blacklist", /* 交易的授权执行人在黑名单中 */ 
  3130003: "Contract to execute is not on the whitelist", /* 要执行的合约不在白名单中 */ 
  3130004: "Contract to execute is on the blacklist", /* 要执行的合约在黑名单中 */ 
  3130005: "Action to execute is on the blacklist", /* 要执行的动作在黑名单中 */ 
  3130006: "Public key in authority is on the blacklist", /* 授权中的公钥在黑名单中 */ 
  3140000: "Exceptions that are allowed to bubble out of emit calls in controller", /* 控制器异常 */ 
  3140001: "Block does not match checkpoint", /* 区块与检查点不匹配 */ 
  3160000: "Contract exception", /* 合约异常 */ 
  3160001: "The payer of the table data is invalid", /* 表数据支付账号无效 */ 
  3160002: "Table access violation", /* 数据表访问违规 */ 
  3160003: "Invalid table iterator", /* 无效的数据表迭代器 */ 
  3160004: "Table can not be found inside the cache", /* 缓存中找不到指定的数据表 */ 
  3160005: "The table operation is not allowed", /* 不允许数据表操作 */ 
  3160006: "Invalid contract vm type", /* 无效的合约虚拟机类型 */ 
  3160007: "Invalid contract vm version", /* 无效的合约虚拟机版本 */ 
  3160008: "Contract is already running this version of code", /* 合约已经在运行这个版本的代码 */ 
  3160009: "No wast file found", /* 没有找到wast文件 */ 
  3160010: "No abi file found", /* 没有找到abi文件 */ 
  3170000: "Producer exception", /* 出块人异常 */ 
  3170001: "Producer private key is not available", /* 出块人私钥无效 */ 
  3170002: "Pending block state is missing", /* 待定区块状态丢失 */ 
  3170003: "Producer is double confirming known range", /* 出块人双重确认 */ 
  3170004: "Producer schedule exception", /* 出块人调度计划异常 */ 
  3170006: "The producer is not part of current schedule", /* 出块人不属于当前安排计划 */ 
  3170007: "The configured snapshot directory does not exist", /* 配置的快照目录不存在 */ 
  3170008: "The requested snapshot already exists", /* 请求的快照已经存在 */ 
  3180000: "Reversible Blocks exception", /* 可逆区块异常 */ 
  3180001: "Invalid reversible blocks directory", /* 无效的可逆区块目录 */ 
  3180002: "Backup directory for reversible blocks already existg", /* 可逆块的备份目录已存在 */ 
  3180003: "Gap in the reversible blocks database", /* 不连续的可逆区块数据库 */ 
  3190000: "Block log exception", /* 区块日志异常 */ 
  3190001: "unsupported version of block log", /* 不支持的区块日志版本 */ 
  3190002: "fail to append block to the block log", /* 向区块日志添加区块时失败 */ 
  3190003: "block log can not be found", /* 找不到区块日志 */ 
  3190004: "block log backup dir already exists", /* 区块日志备份目录已存在 */ 
  3200000: "http exception", /* http异常 */ 
  3200001: "invalid http client root certificate", /* 无效的http客户端证书 */ 
  3200002: "invalid http response", /* 无效的http请求 */ 
  3200003: "service resolved to multiple ports", /* 服务对应多个端口 */ 
  3200004: "fail to resolve host", /* 解析主机名失败 */ 
  3200005: "http request fail", /* http请求失败 */ 
  3200006: "invalid http request", /* 无效的http请求 */ 
  3210000: "Resource limit exception", /* 资源限制异常 */ 
  3220000: "Mongo DB exception", /* MongoDB异常 */ 
  3220001: "Fail to insert new data to Mongo DB", /* MongoDB插入数据失败 */ 
  3220002: "Fail to update existing data in Mongo DB", /* MongoDB更新数据失败 */ 
  3230000: "Contract API exception", /* 合约API异常 */ 
  3230001: "Crypto API Exception", /* 密码学API异常 */ 
  3230002: "Database API Exception", /* 数据库API异常 */ 
  3230003: "Arithmetic Exception", /* 算术异常 */ 
  3240000: "Snapshot exception", /* 快照异常 */ 
  3240001: "Snapshot Validation Exception", /* 快照验证异常 */   
};

module.exports = {
  xInfo           : xInfo,
  customAccount   : customAccount,
  permissionDict  : permissionDict,
  retryDict       : retryDict,
  sleepTimeDict   : sleepTimeDict,
  nodeDict        : nodeDict,
  eosERROR        : eosERROR,
  wanAddrs        : wanAddrs,
  pks             : pks,
  htlcTblDict     : htlcTblDict,
  signContractFile    : signContractFile,
  htlcContractFile    : htlcContractFile,
  sysTokenContract    : sysTokenContract,
  customTokenContract : customTokenContract,
  customSignContract  : customSignContract,
};