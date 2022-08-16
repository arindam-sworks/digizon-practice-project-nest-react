import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateProductDto } from 'src/products/dto/create-product.dto';

import { Products, SkuDetails } from '../schema/products';
import { ParsedOptions } from 'qs-to-mongo/lib/query/options-to-mongo';
@Injectable()
export class ProductRepository {
  constructor(
    @InjectModel(Products.name)
    private readonly productModel: Model<Products>,
  ) {}

  // create product details
  async createProductInDB(data: CreateProductDto): Promise<Products> {
    const product = new this.productModel(data);
    return await product.save();
  }

  // upadte image for product
  async updateProductImageDetailsInDB(
    id: string,
    imageDetails: Record<string, any>,
  ): Promise<any> {
    return await this.productModel.updateOne(
      { _id: id },
      { $set: { ...imageDetails } },
    );
  }

  // get product details by id
  async getProductDetailsById(id: string): Promise<any> {
    const product = await this.productModel.findById(id);
    return product;
  }

  // get related product details by id
  async getRelatedProducts(category: string): Promise<any> {
    const product = await this.productModel
      .find({ category: category, isSoldOut: false })
      .limit(4);
    return product;
  }

  // update product details
  async updateProductDetailsInDB(
    id: string,
    data: CreateProductDto,
  ): Promise<any> {
    return await this.productModel.updateOne({ _id: id }, { $set: data });
  }

  // delete product details
  async deleteProductDetailsInDB(id: string): Promise<any> {
    return await this.productModel.findByIdAndDelete(id);
  }

  // get all products with sorting and filtering
  async getAllProductsFromDB(
    criteria: Record<string, any>,
    options: ParsedOptions,
  ): Promise<any> {
    options.sort = options.sort || { _id: -1 };
    options.skip = options.skip || 0;
    options.limit = options.limit || 12;

    if (criteria.search) {
      criteria.productName = { $regex: new RegExp(criteria.search, 'i') };
      delete criteria.search;
    }

    console.log(criteria, options);

    // aggregate products with citeria and options
    const products = await this.productModel.aggregate([
      { $match: criteria },
      { $sort: options.sort },
      { $skip: options.skip },
      { $limit: options.limit },
      { $unwind: { path: '$skuDetails', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          'skuDetails.licenceKeys': 0,
          'feedbackDetails.info': 0,
          imageDetails: 0,
        },
      },
      {
        $group: {
          _id: '$_id',
          data: { $first: '$$ROOT' },
        },
      },
      { $replaceRoot: { newRoot: '$data' } },
    ]);
    // get total products count
    const total = await this.productModel.countDocuments(criteria);
    return {
      total,
      result: products,
    };
  }

  // update with array of sku details in product
  async updateWithArrayOfSkuDetailsInDB(
    id: string,
    data: SkuDetails[],
  ): Promise<any> {
    return await this.productModel.findOneAndUpdate(
      { _id: id },
      { $push: { skuDetails: { $each: data } } },
      {
        new: true,
      },
    );
  }

  // update sku details  in product
  async updateSkuDetailsInDB(
    id: string,
    skuId: string,
    data: Record<string, any>,
  ): Promise<any> {
    const dataForUpdate = {};
    Object.keys(data).forEach((key) => {
      dataForUpdate[`skuDetails.$.${key}`] = data[key];
    });
    return await this.productModel.updateOne(
      { _id: id, 'skuDetails._id': skuId },
      { $set: dataForUpdate },
    );
  }

  // delete a sku details  in product
  async deleteSkuDetailsInDB(
    id: string,
    skuId: string,
    allDelete = false,
  ): Promise<any> {
    if (allDelete) {
      return await this.productModel.updateOne(
        { _id: id },
        { $set: { skuDetails: [] } },
      );
    }
    return await this.productModel.updateOne(
      { _id: id },
      { $pull: { skuDetails: { _id: skuId } } },
    );
  }
}
