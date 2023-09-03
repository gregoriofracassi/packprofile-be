export const firstCapital = (str) => {
   return str.charAt(0).toUpperCase() + str.slice(1);
 }

export const generateHandle = (user) => {
   const { firstName, lastName } = user
   const handle = '@' + firstCapital(firstName) + firstCapital(lastName)
   return handle
}

export const formatHandle = (handle) => {
   return '@' + handle
}