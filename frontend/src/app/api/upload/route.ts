import { NextRequest, NextResponse } from 'next/server';
import { PinataSDK } from 'pinata';

export async function POST(request: NextRequest) {
  // Check if JWT is configured
  if (!process.env.PINATA_JWT) {
    console.error('PINATA_JWT environment variable is not set');
    return NextResponse.json(
      { error: 'Server misconfigured: Missing Pinata JWT. Add PINATA_JWT to .env.local' },
      { status: 500 }
    );
  }

  const pinata = new PinataSDK({
    pinataJwt: process.env.PINATA_JWT,
    pinataGateway: process.env.PINATA_GATEWAY || 'gateway.pinata.cloud',
  });

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
    }

    // Upload to Pinata IPFS
    console.log('Uploading file to Pinata:', file.name, file.size);
    const upload = await pinata.upload.public.file(file);
    console.log('Upload successful:', upload.id, upload.cid);

    const gatewayUrl = `https://${process.env.PINATA_GATEWAY || 'gateway.pinata.cloud'}/ipfs/${upload.cid}`;

    return NextResponse.json({
      success: true,
      id: upload.id,  // Pinata file ID (needed for deletion)
      cid: upload.cid, // IPFS CID (for the URL)
      url: gatewayUrl,
    });
  } catch (error: any) {
    console.error('Upload error:', error?.message || error);
    return NextResponse.json(
      { error: `Failed to upload: ${error?.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  // Check if JWT is configured
  if (!process.env.PINATA_JWT) {
    console.error('PINATA_JWT environment variable is not set');
    return NextResponse.json(
      { error: 'Server misconfigured: Missing Pinata JWT' },
      { status: 500 }
    );
  }

  const pinata = new PinataSDK({
    pinataJwt: process.env.PINATA_JWT,
    pinataGateway: process.env.PINATA_GATEWAY || 'gateway.pinata.cloud',
  });

  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'No file ID provided' }, { status: 400 });
    }

    // Delete the file from Pinata public files
    console.log('Deleting file from Pinata:', id);
    await pinata.files.public.delete([id]);
    console.log('Delete successful:', id);

    return NextResponse.json({
      success: true,
      message: `Deleted ${id}`,
    });
  } catch (error: any) {
    console.error('Delete error:', error?.message || error);
    return NextResponse.json(
      { error: `Failed to delete: ${error?.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}
