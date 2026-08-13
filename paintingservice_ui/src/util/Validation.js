export const ValidateEmail = (email) => {
    if (email.trim()) {
        const regex =
            /[a-z0-9\\._%+!$&*=^|~#%'`?{}/\\-]+@([a-z0-9\\-]+\.){1,}([a-z]{2,16})/;
        return regex.test(email);
    }
    return false;
};
