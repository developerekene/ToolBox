import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { collection, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../../../Firebase";
import { store } from "../../store";
import { setUser } from "../userSlice";

const generateUniqueId = (): string => {
    return Math.random().toString(36).substr(2, 9);
};

const getCurrentUserPromise = (): Promise<any> => {
    return new Promise((resolve, reject) => {
        const unsuscribe = auth.onAuthStateChanged((user) => {
            unsuscribe();
            if (user) {
                resolve(user);
            } else {
                reject(new Error("No user is currently signed in"));
            }
        });
    });
};

export class AuthService {
    async getCurrentUser(): Promise<any> {
        return getCurrentUserPromise();
    }

    async handleUserRegistration(userData: any): Promise<any> {
        try {
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                userData.email,
                userData.password,
            );
            const user = userCredential.user;
            const systemsOneAccount = {
                user: {
                    primaryInformation: {
                        firstName: userData.firstName,
                        lastName: userData.lastName,
                        email: userData.email,
                        isUserLoggedIn: true,
                        userType: "individual",
                        userId: user.uid,
                        membershipTier: "sliver",
                        affiliate: "toolbox"
                    },
                    secondaryInformation: {
                        accountType: "individual",
                        userReferenceId: user.uid + generateUniqueId(),
                    },
                    locationAndTime: {
                        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                        locale: "en-US",
                        location: "",
                    },
                },
            };

            const userDocData = doc(collection(db, "users"), user.uid);
            await setDoc(userDocData, systemsOneAccount);
            const userSnapshot = await getDoc(userDocData);
            if (userSnapshot.exists()) {
                const getUserData = userSnapshot.data();
                const dataForRedux = getUserData?.user?.primaryInformation;
                store.dispatch(
                    setUser({
                        firstName: dataForRedux?.firstName,
                        lastName: dataForRedux?.lastName,
                        email: dataForRedux?.email,
                        membershipTier: dataForRedux?.membershipTier,
                    }),
                );
            }
        } catch (error) {
            console.error("Error during user registration:", error);
            throw error;
        } finally {
        }
    }

    async handleUserLoginWithEmailPassword(
        email: string,
        password: string,
    ): Promise<any> {
        try {
            const userCredential = await signInWithEmailAndPassword(
                auth,
                email,
                password,
            );
            const user = userCredential.user;

            const userDocData = doc(collection(db, "users"), user.uid);
            const userSnapshot = await getDoc(userDocData);

            if (userSnapshot.exists()) {
                const getUserData = userSnapshot.data();
                const dataForRedux = getUserData?.user?.primaryInformation;

                store.dispatch(
                    setUser({
                        firstName: dataForRedux?.firstName,
                        lastName: dataForRedux?.lastName,
                        email: dataForRedux?.email,
                        membershipTier: dataForRedux?.membershipTier,
                    }),
                );

                return getUserData;
            }

            return null;
        } catch (error) {
            console.error("Error during email/password login:", error);
            throw error;
        }
    }

    async uploadOTP(updateData: Partial<string>): Promise<void> {
        try {
            const currentUser = await this.getCurrentUser();
            const userId = currentUser.uid;
            const userDoc = doc(db, "users", userId);
            const userSnapShot = await getDoc(userDoc);
            if (!userSnapShot.exists()) throw new Error("user not found");

            const writePayload: Record<string, any> = {
                "user.otp": updateData,
            };

            await updateDoc(userDoc, writePayload);
        } catch (error) {
            console.error("Error updating primary information:", error);
            throw error;
        }
    }
}

export const authService = new AuthService