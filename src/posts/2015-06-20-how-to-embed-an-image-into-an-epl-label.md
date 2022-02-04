---
layout: post
title: How to embed an image into an EPL label
permalink: blog/2015/06/20/how-to-embed-an-image-into-an-epl-label/index.html
excerpt: Generating and combining EPL
date: 2015-06-20
updatedDate: 2015-06-20
tags:
  - post
  - csharp
---

Our current project, has the ability to generate and combine [EPL](https://en.wikipedia.org/wiki/Eltron_Programming_Language) labels from different sources. One of the scenarios required to embed an image (png) into a generated label.

## GW - Direct Graphic Write command

**Description** Use this command to load binary graphic data directly into the Image Buffer memory for immediate printing. The printer does not store graphic data sent directly to the image buffer.

The graphic data is lost when the image has finished printing, power is removed or the printer is reset. Commands that size (Q and q) or clear (N and M) the image buffer will also remove graphic image data.

**Syntax** GWp1,p2,p3,p4,DATA

- **p1** Horizontal start position (X) in dots.
- **p2** Vertical start position (Y) in dots.
- **p3** Width of graphic in bytes. Eight (8) dots = one (1) byte of data.
- **p4** Length of graphic in dots (or print lines)
- **DATA** Raw binary data without graphic file formatting. Data must be in bytes. Multiply the width in bytes (p3) by the number of print lines (p4) for the total amount of graphic data. The printer automatically calculates the exact size of the data block based upon this formula.

## The challenge

The challenge here was to figure out what they exactly mean by _Raw binary data without graphic file formatting_!

So after some googling a colleague of mine found the following working solution on [CodeProject](http://www.codeproject.com/Tips/667062/Print-Image-to-Zebra-Printer-using-EPL-Language) and adapted it to our needs.

```csharp
using System;
using System.Drawing;
using System.IO;
using System.Text;

private static string SendImageToPrinter(int top, int left, Bitmap bitmap)
{
  using (MemoryStream ms = new MemoryStream())
  using (BinaryWriter bw = new BinaryWriter(ms, Encoding.ASCII))
  {
    //we set p3 parameter, remember it is Width of Graphic in bytes,
    //so we divide the width of image and round up of it
    int P3 = (int)Math.Ceiling((double)bitmap.Width / 8);
    bw.Write(Encoding.ASCII.GetBytes(string.Format
    ("GW{0},{1},{2},{3},", top, left, P3, bitmap.Height)));
    //the width of matrix is rounded up multi of 8
    int canvasWidth = P3 * 8;
    //Now we convert image into 2 dimension binary matrix by 2 for loops below,
    //in the range of image, we get colour of pixel of image,
    //calculate the luminance in order to set value of 1 or 0
    //otherwise we set value to 1
    //Because P3 is set to byte (8 bits), so we gather 8 dots of this matrix,
    //convert into a byte then write it to memory by using shift left operator <<
    //e,g 1 << 7  ---> 10000000
    //    1 << 6  ---> 01000000
    //    1 << 3  ---> 00001000
    for (int y = 0; y < bitmap.Height; ++y)     //loop from top to bottom
    {
      for (int x = 0; x < canvasWidth; )       //from left to right
      {
        byte abyte = 0;
        for (int b = 0; b < 8; ++b, ++x)     //get 8 bits together and write to memory
        {
          int dot = 1;                     //set 1 for white,0 for black
          //pixel still in width of bitmap,
          //check luminance for white or black, out of bitmap set to white
          if (x < bitmap.Width)
          {
            Color color = bitmap.GetPixel(x, y);
            int luminance = (int)((color.R * 0.3) + (color.G * 0.59) + (color.B * 0.11));
            dot = luminance > 127 ? 1 : 0;
          }
          abyte |= (byte)(dot << (7 - b)); //shift left,
          //then OR together to get 8 bits into a byte
        }
        bw.Write(abyte);
      }
    }
    bw.Write("\n");
    bw.Flush();
    //reset memory
    ms.Position = 0;
    //get encoding, I have no idea why encode page of 1252 works and fails for others
    return Encoding.GetEncoding(1252).GetString(ms.ToArray());
  }
}
```

## The problem

After analyzing the performance of our code under high load, we came to the conclusion that this extraction was actually really slowing the entire process down. It took around 1.5 seconds on average for a 10KB image (caused by usage of GetPixel).

### What does it do?

- Extracts raw binary data
- Transforms the image into black and white
- Adds a white overlay over parts that actually are out of bounds

### What we needed?

- Extract the raw binary data

As we already had an image within bounds which was already black and white (greyscale) in format1bppindexed format.

#### Extract raw binary fast (avg 84ms on 10KB file)

```csharp
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

private static byte[] GetRawPixelData(Image image)
{
  using (var bitmap = (Bitmap) image)
  {
    var bitmapData = bitmap.LockBits(new Rectangle(0, 0, bitmap.Width, bitmap.Height), ImageLockMode.ReadOnly, PixelFormat.Format1bppIndexed);
    try
    {
      var length = bitmapData.Stride*bitmapData.Height;
      byte[] bytes = new byte[length];

      // Copy bitmap to byte[]
      Marshal.Copy(bitmapData.Scan0, bytes, 0, length);

      return bytes;
    }
    finally
    {
      // Make sure we unlock no matter what
      bitmap.UnlockBits(bitmapData);
    }
  }
}
```

#### Conversion to black and white (greyscale)

```csharp
using System.Drawing;
using System.Drawing.Imaging;

public void ConvertToGrayscale(Image image)
{
  using (Bitmap bitmap = new Bitmap(image.Width, image.Height))
  {
    using (var g = Graphics.FromImage(bitmap))
    {
      //create the grayscale ColorMatrix
      var colorMatrix = new ColorMatrix(
          new[]
          {
              new[] {.3f, .3f, .3f, 0, 0},
              new[] {.59f, .59f, .59f, 0, 0},
              new[] {.11f, .11f, .11f, 0, 0},
              new float[] {0, 0, 0, 1, 0},
              new float[] {0, 0, 0, 0, 1}
          });

      //create some image attributes
      ImageAttributes attributes = new ImageAttributes();

      //set the color matrix attribute
      attributes.SetColorMatrix(colorMatrix);

      //draw the original image on the new image
      //using the grayscale color matrix
      g.DrawImage(image, new Rectangle(0, 0, image.Width, image.Height),
          0, 0, image.Width, image.Height, GraphicsUnit.Pixel, attributes);
    }
  }
}
```
