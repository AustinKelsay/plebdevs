import prisma from "@/db/prisma";

export const getAllNip05s = async () => {
    return await prisma.nip05.findMany();
};

export const getNip05ByName = async (name) => {
    return await prisma.nip05.findFirst({
        where: { name },
    });
};

export const getNip05 = async (userId) => {
    return await prisma.nip05.findUnique({
        where: { userId },
    });
};

export const createNip05 = async (userId, pubkey, name) => {
    return await prisma.nip05.create({
        data: { userId, pubkey, name },
    });
};

export const updateNip05 = async (userId, data) => {
    return await prisma.nip05.update({
        where: { userId },
        data,
    });
};

export const deleteNip05 = async (userId) => {
    return await prisma.nip05.delete({
        where: { userId },
    });
};
