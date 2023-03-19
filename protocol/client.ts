import { Protocol } from '../communications/types';

function handleInput(input: string): string {
    const words = input.split(" ");
    const communicationCheck = Protocol.parse(input);
    if ('error' in communicationCheck) {
        return JSON.stringify(communicationCheck, null, 4);
    }
    return JSON.stringify(communicationCheck, null, 4);
//   switch (words[0]) {
//     case 'get':
//     case 'g': {
//         switch (words[1]) {
//             case 'ids':
//             case 'i': {
//                 return `\n\tUsername: ${localStorage.getItem('username') ?? 'null'}` +
//                 `\n    Public ID: ${localStorage.getItem('publicId') ?? 'null'}` + 
//                 `\n    Auth ID: ${localStorage.getItem('authId') ?? 'null'}`;
//             }
//             case '?': {
//                 return `get {ids}`;
//             }
//         }
//     }
//     case 'id': {
//         if (!words[1]) {
//             return `\n\tUsername: ${localStorage.getItem('username') ?? 'null'}` +
//             `\n    Public ID: ${localStorage.getItem('publicId') ?? 'null'}` +
//             `\n    Auth ID: ${localStorage.getItem('authId') ?? 'null'}`;
//         }
//         switch (words[1]) {
//             case 'u':'';
//             case 'user':
//             case 'username': {
//                 if (words[2]) {
//                     const username = words[2] == '0' ?  null : words[2];
//                     const msg = `Username: ${localStorage.getItem('username') ?? 'null'} -> ${username ?? 'null'}`;
//                     words[2] == '0' ? localStorage.removeItem('username') : localStorage.setItem('username', username!);
//                     return msg;
//                 }
//                 return `Username: ${localStorage.getItem('username') ?? 'null'}`
//             }
//             case 'p':
//             case 'pub':
//             case 'public': {
//                 if (words[2]) {
//                     const publicId = words[2] == '0' ?  null : words[2];
//                     const msg = `Public ID: ${localStorage.getItem('publicId') ?? 'null'} -> ${publicId ?? 'null'}`;
//                     words[2] == '0' ? localStorage.removeItem('publicId') : localStorage.setItem('publicId', publicId!);
//                     return msg;
//                 }
//                 return `Public ID: ${localStorage.getItem('publicId') ?? 'null'}`
//             }
//             case 'a':
//             case 'auth': {
//                 if (words[2]) {
//                     const authId = words[2] == '0' ?  null : words[2];
//                     const msg = `Auth ID: ${localStorage.getItem('authId') ?? 'null'} -> ${authId ?? 'null'}`;
//                     words[2] == '0' ? localStorage.removeItem('authId') : localStorage.setItem('authId', authId!);
//                     return msg;
//                 }
//                 return `Auth ID: ${localStorage.getItem('authId') ?? 'null'}`
//             }
//         }    
//     }
//   }
  return 'invalid input';
}

export default handleInput;